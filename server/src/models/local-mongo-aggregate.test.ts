import { mongoAggregate } from './local-mongo-aggregate';

// 测试数据
const testData = [
  {
    _id: 1,
    name: 'John Doe',
    age: 28,
    department: 'Engineering',
    salary: 50000,
    tags: ['developer', 'javascript'],
    projects: [
      { name: 'Project A', role: 'developer' },
      { name: 'Project B', role: 'lead' }
    ]
  },
  {
    _id: 2,
    name: 'Jane Smith',
    age: 32,
    department: 'Engineering',
    salary: 60000,
    tags: ['developer', 'typescript'],
    projects: [
      { name: 'Project A', role: 'designer' }
    ]
  },
  {
    _id: 3,
    name: 'Bob Johnson',
    age: 45,
    department: 'Management',
    salary: 80000,
    tags: ['manager'],
    projects: []
  },
  {
    _id: 4,
    name: 'Alice Brown',
    age: 35,
    department: 'Marketing',
    salary: 55000,
    tags: ['marketing', 'design'],
    projects: [
      { name: 'Project C', role: 'manager' }
    ]
  }
];

describe('mongoAggregate', () => {
  test('should handle $match stage', () => {
    const pipeline = [
      { $match: { department: 'Engineering' } }
    ];
    
    const result = mongoAggregate(testData, pipeline);
    
    expect(result).toHaveLength(2);
    expect(result.every(doc => doc.department === 'Engineering')).toBe(true);
  });
  
  test('should handle $project stage', () => {
    const pipeline = [
      { $project: { name: 1, age: 1, _id: 0 } }
    ];
    
    const result = mongoAggregate(testData, pipeline);
    
    expect(result).toHaveLength(4);
    expect(result.every(doc => 'name' in doc && 'age' in doc && !('_id' in doc))).toBe(true);
  });
  
  test('should handle $sort stage', () => {
    const pipeline = [
      { $sort: { age: -1 } }
    ];
    
    const result = mongoAggregate(testData, pipeline);
    
    expect(result).toHaveLength(4);
    expect(result[0].age).toBe(45);
    expect(result[1].age).toBe(35);
    expect(result[2].age).toBe(32);
    expect(result[3].age).toBe(28);
  });
  
  test('should handle $limit stage', () => {
    const pipeline = [
      { $sort: { age: -1 } },
      { $limit: 2 }
    ];
    
    const result = mongoAggregate(testData, pipeline);
    
    expect(result).toHaveLength(2);
    expect(result[0].age).toBe(45);
    expect(result[1].age).toBe(35);
  });
  
  test('should handle $skip stage', () => {
    const pipeline = [
      { $sort: { age: -1 } },
      { $skip: 2 }
    ];
    
    const result = mongoAggregate(testData, pipeline);
    
    expect(result).toHaveLength(2);
    expect(result[0].age).toBe(32);
    expect(result[1].age).toBe(28);
  });
  
  test('should handle $group stage', () => {
    const pipeline = [
      { $group: { _id: '$department', totalSalary: { $sum: '$salary' }, count: { $sum: 1 } } }
    ];
    
    const result = mongoAggregate(testData, pipeline);
    
    expect(result).toHaveLength(3);
    const engineeringGroup = result.find(g => g._id === 'Engineering');
    expect(engineeringGroup?.totalSalary).toBe(110000);
    expect(engineeringGroup?.count).toBe(2);
  });
  
  test('should handle $unwind stage', () => {
    const pipeline = [
      { $match: { _id: 1 } },
      { $unwind: '$projects' }
    ];
    
    const result = mongoAggregate(testData, pipeline);
    console.log('result', result);
    expect(result).toHaveLength(2);
    expect(result[0].projects.name).toBe('Project A');
    expect(result[1].projects.name).toBe('Project B');
  });
  
  test('should handle $addFields stage', () => {
    const pipeline = [
      { $addFields: { bonus: { $multiply: ['$salary', 0.1] } } }
    ];
    
    const result = mongoAggregate(testData, pipeline);
    
    expect(result).toHaveLength(4);
    expect(result[0].bonus).toBe(5000);
    expect(result[1].bonus).toBe(6000);
  });
  
  test('should handle multiple stages', () => {
    const pipeline = [
      { $match: { department: 'Engineering' } },
      { $project: { name: 1, salary: 1, _id: 0 } },
      { $sort: { salary: -1 } },
      { $addFields: { bonus: { $multiply: ['$salary', 0.15] } } }
    ];
    
    const result = mongoAggregate(testData, pipeline);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Jane Smith');
    expect(result[0].salary).toBe(60000);
    expect(result[0].bonus).toBe(9000);
    expect(result[1].name).toBe('John Doe');
    expect(result[1].salary).toBe(50000);
    expect(result[1].bonus).toBe(7500);
  });
});
