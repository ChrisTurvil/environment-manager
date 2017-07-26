/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire').noCallThru();
let SecurityGroup = require('models/SecurityGroup');

function setup(securityGroups = []) {
  let fakes = {
    'queryHandlers/ScanSecurityGroups':
    sinon.stub().returns(Promise.resolve(securityGroups.map(x => new SecurityGroup(x))))
  };
  let sut = proxyquire('modules/provisioning/launchConfiguration/securityGroupsProvider', fakes);
  return [sut, fakes];
}

describe('SecurityGroupsProvider:', () => {
  let loggerMock = {
    warn: () => { },
    info: () => { },
    error: () => { }
  };

  describe('when server role configuration has "SecurityZone" set to "Other"', () => {
    let configuration = {
      serverRole: {
        SecurityZone: 'Other',
        ServerRoleName: 'Web'
      },
      environmentType: {
        VpcId: 'vpc-id'
      },
      cluster: {
        Name: 'Tango'
      }
    };

    let accountName = 'Sandbox';
    let region = 'my-region';

    describe('and instances image is "Windows" based', () => {
      let image = {
        name: 'windows-2012r2-ttl-app-0.0.1',
        type: 'windows-2012r2-ttl-app',
        version: '0.0.1',
        platform: 'Windows'
      };

      describe('and all security groups exist in AWS', () => {
        let expectedOSSecurityGroup = {
          GroupId: 'sg-os-windows',
          Tags: [{ Key: 'Name', Value: 'sgOSWindows' }]
        };

        let expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }]
        };

        let promise = null;
        let fakes;
        before('getting security groups by configuration, image and account', () => {
          let [sut, $fakes] = setup([expectedOSSecurityGroup, expectedRoleSecurityGroup]);
          fakes = $fakes;
          promise = sut.getFromConfiguration(configuration, image, accountName, region, loggerMock);
        });

        it('should be possible to check security group existance in AWS', () => {
          return promise.then(() =>
            sinon.assert.calledWith(
              fakes['queryHandlers/ScanSecurityGroups'],
              sinon.match({
                accountId: accountName,
                region,
                vpcId: configuration.environmentType.VpcId
              })));
        });

        it('should be possible to get a security group for Windows platform', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();
            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));
            sinon.assert.calledWith(
              fakes['queryHandlers/ScanSecurityGroups'],
              sinon.match(x => x.groupNames.includes('sgOSWindows'))
            );
          });
        });

        it('should be possible to get a security group for role and cluster', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();
            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));
            sinon.assert.calledWith(
              fakes['queryHandlers/ScanSecurityGroups'],
              sinon.match(x => x.groupNames.includes(`sgRole${configuration.cluster.Name}${configuration.serverRole.ServerRoleName}`))
            );
          });
        });

        it('should not return any unexpected security group', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            securityGroupIds.should.have.length(2);
          });
        });
      });
    });

    describe('and instances image is "Linux" based', () => {
      let image = {
        name: 'oel-7-ttl-nodejs-0.0.1',
        type: 'oel-7-ttl-nodejs',
        version: '0.0.1',
        platform: 'Linux'
      };

      describe('and all security groups exist in AWS', () => {
        let expectedOSSecurityGroup = {
          GroupId: 'sg-os-linux',
          Tags: [{ Key: 'Name', Value: 'sgOSLinux' }]
        };

        let expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }]
        };

        let promise;
        let fakes;
        before('getting security groups by configuration, image and account', () => {
          let [sut, $fakes] = setup([expectedOSSecurityGroup, expectedRoleSecurityGroup]);
          fakes = $fakes;
          promise = sut.getFromConfiguration(configuration, image, accountName, loggerMock);
        });

        it('should be possible to get a security group for Linux platform', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));

            sinon.assert.calledWith(
              fakes['queryHandlers/ScanSecurityGroups'],
              sinon.match(x => x.groupNames.includes('sgOSLinux')));
          });
        });
      });

      describe('and linux platform related group does not exist in AWS', () => {
        let expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }]
        };

        let promise;
        before('getting security groups by configuration, image and account', () => {
          let [sut] = setup([expectedRoleSecurityGroup]);
          promise = sut.getFromConfiguration(configuration, image, accountName, loggerMock);
        });

        it('should be possible to understand the error', () => {
          // Assert
          return promise.should.be.rejectedWith(
            /Security group "sgOSLinux" not found in "vpc-id" VPC. It is assigned by default because instances image is Linux based/
          );
        });
      });
    });
  });

  describe('when server role configuration has "SecurityZone" set to "Secure"', () => {
    let configuration = {
      serverRole: {
        SecurityZone: 'Secure',
        ServerRoleName: 'Web'
      },
      environmentType: {
        VpcId: 'vpc-id'
      },
      cluster: {
        Name: 'Tango'
      }
    };

    let accountName = 'Sandbox';
    let region = 'my-region';

    describe('and instances image is "Windows" based', () => {
      let image = {
        name: 'windows-2012r2-ttl-app-0.0.1',
        type: 'windows-2012r2-ttl-app',
        version: '0.0.1',
        platform: 'Windows'
      };

      describe('and all security groups exist in AWS', () => {
        let expectedOSSecurityGroup = {
          GroupId: 'sg-os-windows-secure',
          Tags: [{ Key: 'Name', Value: 'sgOSWindowsSecure' }]
        };

        let expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }]
        };

        let expectedSecurityZoneSecurityGroup = {
          GroupId: 'sg-zone-secure',
          Tags: [{ Key: 'Name', Value: 'sgZoneSecure' }]
        };

        let promise;
        let fakes;
        before('getting security groups by configuration, image and account', () => {
          // Act
          let [sut, $fakes] = setup([expectedOSSecurityGroup, expectedRoleSecurityGroup, expectedSecurityZoneSecurityGroup]);
          fakes = $fakes;
          promise = sut.getFromConfiguration(configuration, image, accountName, region, loggerMock);
        });

        it('should be possible to get a security group for Windows secure platform', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));
            sinon.assert.calledWith(
              fakes['queryHandlers/ScanSecurityGroups'],
              sinon.match(x => x.groupNames.includes('sgOSWindowsSecure')));
          });
        });

        it('should be possible to get a security group for secure SecurityZone', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();


            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedSecurityZoneSecurityGroup.GroupId));
            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));
            sinon.assert.calledWith(
              fakes['queryHandlers/ScanSecurityGroups'],
              sinon.match(x => x.groupNames.includes('sgZoneSecure')));
          });
        });

        it('should not return any unexpected security group', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            securityGroupIds.should.have.length(3);
          });
        });
      });
    });

    describe('and instances image is "Linux" based', () => {
      let image = {
        name: 'oel-7-ttl-nodejs-0.0.1',
        type: 'oel-7-ttl-nodejs',
        version: '0.0.1',
        platform: 'Linux'
      };

      describe('and all security groups exist in AWS', () => {
        let expectedOSSecurityGroup = {
          GroupId: 'sg-os-linux-secure',
          Tags: [{ Key: 'Name', Value: 'sgOSLinuxSecure' }]
        };

        let expectedRoleSecurityGroup = {
          GroupId: 'sg-role-tango-web',
          Tags: [{ Key: 'Name', Value: 'sgRoleTangoWeb' }]
        };

        let expectedSecurityZoneSecurityGroup = {
          GroupId: 'sg-zone-secure',
          Tags: [{ Key: 'Name', Value: 'sgZoneSecure' }]
        };

        let promise;
        let fakes;
        before('getting security groups by configuration, image and account', () => {
          let [sut, $fakes] = setup([
            expectedOSSecurityGroup,
            expectedRoleSecurityGroup,
            expectedSecurityZoneSecurityGroup
          ]);
          fakes = $fakes;
          promise = sut.getFromConfiguration(configuration, image, accountName, region, loggerMock);
        });

        it('should be possible to get a security group for Linux secure platform', () => {
          // Assert
          return promise.then((securityGroupIds) => {
            should(securityGroupIds).be.Array();

            securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedOSSecurityGroup.GroupId));
            sinon.assert.calledWith(
              fakes['queryHandlers/ScanSecurityGroups'],
              sinon.match(x => x.groupNames.includes('sgOSLinuxSecure')));
          });
        });
      });
    });
  });

  describe('when server role configuration has "SecurityGroups" set to a list of additional security groups', () => {
    let configuration = {
      serverRole: {
        SecurityZone: 'Other',
        SecurityGroups: [
          'sgCustomOne',
          'sgCustomTwo'
        ],
        ServerRoleName: 'Web'
      },
      environmentType: {
        VpcId: 'vpc-id'
      },
      cluster: {
        Name: 'Tango'
      }
    };

    let image = {
      name: 'windows-2012r2-ttl-app-0.0.1',
      type: 'windows-2012r2-ttl-app',
      version: '0.0.1',
      platform: 'Windows'
    };

    describe('and all security groups exist in AWS', () => {
      let accountName = 'Sandbox';
      let region = 'my-region';

      let expectedOSSecurityGroup = {
        GroupId: 'sg-os-windows',
        Tags: [{ Key: 'Name', Value: 'sgOSWindows' }]
      };

      let expectedCustomOneSecurityGroup = {
        GroupId: 'sg-custom-one',
        Tags: [{ Key: 'Name', Value: 'sgCustomOne' }]
      };

      let expectedCustomTwoSecurityGroup = {
        GroupId: 'sg-custom-two',
        Tags: [{ Key: 'Name', Value: 'sgCustomTwo' }]
      };

      let promise;
      let fakes;
      before('getting security groups by configuration, image and account', () => {
        let [sut, $fakes] = setup([
          expectedOSSecurityGroup,
          expectedCustomOneSecurityGroup,
          expectedCustomTwoSecurityGroup
        ]);
        fakes = $fakes;
        promise = sut.getFromConfiguration(configuration, image, accountName, region, loggerMock);
      });

      it('should be possible to get the security groups specified in configuration', () => {
        // Assert
        return promise.then((securityGroupIds) => {
          should(securityGroupIds).be.Array();

          securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedCustomOneSecurityGroup.GroupId));
          securityGroupIds.should.matchAny(it => it.GroupId.should.equal(expectedCustomTwoSecurityGroup.GroupId));
          sinon.assert.calledWith(
            fakes['queryHandlers/ScanSecurityGroups'],
            sinon.match({ groupNames: ['sgCustomOne', 'sgCustomTwo', 'sgOSWindows'] }));
        });
      });

      it('should not return any unexpected security group', () => {
        // Assert
        return promise.then((securityGroupIds) => {
          securityGroupIds.should.have.length(3);
          sinon.assert.neverCalledWith(
            fakes['queryHandlers/ScanSecurityGroups'],
            sinon.match(x => x.groupNames.includes('sgRoleTangoWeb')));
        });
      });
    });
  });
});

