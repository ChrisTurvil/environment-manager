let SampleJob = {
    JobId: '123',
    Status: pending,
    Tasks: {
      Deploy1: {
        TTL: 10000,
        Command: 'deploy/v1',
        Seq: 3,
        LastModified: 1505307558291,
        Status: running,
        Result: null
      },
      Toggle1: {
        DependsOn: ['Deploy1'],
        TTL: 10000,
        Command: 'toggle/v1',
        Seq: 0,
        LastModified: 1505307558291,
        Status: pending,
        Result: null
      }
    }
  };