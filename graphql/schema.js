const { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList, GraphQLFloat, GraphQLSchema } = require('graphql');
const User = require('../models/User');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLID },
        username: { type: GraphQLString },
        email: { type: GraphQLString }
    })
});

const EmployeeType = new GraphQLObjectType({
    name: 'Employee',
    fields: () => ({
        id: { type: GraphQLID },
        first_name: { type: GraphQLString },
        last_name: { type: GraphQLString },
        email: { type: GraphQLString },
        designation: { type: GraphQLString },
        department: { type: GraphQLString },
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        employees: {
            type: new GraphQLList(EmployeeType),
            resolve() {
                return Employee.find();
            }
        },
        employee: {  
            type: EmployeeType,
            args: { id: { type: GraphQLID } },
            async resolve(parent, args) {
                const employee = await Employee.findById(args.id);
                if (!employee) {
                    throw new Error("Employee not found");
                }
                return employee;
            }
        },
        employeesByDeptOrDesignation: {  // ✅ Add this query to filter employees
            type: new GraphQLList(EmployeeType),
            args: {
                department: { type: GraphQLString },
                designation: { type: GraphQLString }
            },
            async resolve(parent, args) {
                let filter = {};
                if (args.department) {
                    filter.department = args.department;
                }
                if (args.designation) {
                    filter.designation = args.designation;
                }
                return Employee.find(filter);
            }
        },
        login: {  // ✅ Add the missing login query
            type: UserType,
            args: {
                email: { type: GraphQLString },
                password: { type: GraphQLString }
            },
            async resolve(parent, args) {
                // Find user by email
                const user = await User.findOne({ email: args.email });
                if (!user) {
                    throw new Error("User not found");
                }

                // Validate password
                const isMatch = await bcrypt.compare(args.password, user.password);
                if (!isMatch) {
                    throw new Error("Invalid credentials");
                }

                return user;
            }
        }
    }
});


const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        signup: {  // ✅ User Signup Mutation
            type: UserType,
            args: {
                username: { type: GraphQLString },
                email: { type: GraphQLString },
                password: { type: GraphQLString }
            },
            async resolve(parent, args) {
                // Check if email already exists
                const existingUser = await User.findOne({ email: args.email });
                if (existingUser) {
                    throw new Error("Email already exists");
                }

                // Hash the password
                const hashedPassword = await bcrypt.hash(args.password, 10);
                
                // Create new user
                const newUser = new User({
                    username: args.username,
                    email: args.email,
                    password: hashedPassword
                });

                return newUser.save();
            }
        },
        login: {  // ✅ User Login Mutation
            type: UserType,
            args: {
                email: { type: GraphQLString },
                password: { type: GraphQLString }
            },
            async resolve(parent, args) {
                // Check if user exists
                const user = await User.findOne({ email: args.email });
                if (!user) {
                    throw new Error("User not found");
                }

                // Compare password
                const isMatch = await bcrypt.compare(args.password, user.password);
                if (!isMatch) {
                    throw new Error("Invalid credentials");
                }

                return user;
            }
        },
        addEmployee: {
            type: EmployeeType,
            args: {
                first_name: { type: GraphQLString },
                last_name: { type: GraphQLString },
                email: { type: GraphQLString },
                gender: { type: GraphQLString },
                designation: { type: GraphQLString },
                salary: { type: GraphQLFloat },
                date_of_joining: { type: GraphQLString },
                department: { type: GraphQLString },
                employee_photo: { type: GraphQLString }
            },
            async resolve(parent, args) {
                const newEmployee = new Employee(args);
                return newEmployee.save();
            }
        },
        updateEmployee: {
            type: EmployeeType,
            args: {
                id: { type: GraphQLID },
                first_name: { type: GraphQLString },
                last_name: { type: GraphQLString },
                email: { type: GraphQLString },
                gender: { type: GraphQLString },
                designation: { type: GraphQLString },
                salary: { type: GraphQLFloat },
                date_of_joining: { type: GraphQLString },
                department: { type: GraphQLString },
                employee_photo: { type: GraphQLString }
            },
            async resolve(parent, args) {
                return Employee.findByIdAndUpdate(
                    args.id,
                    { $set: args },
                    { new: true }
                );
            }
        },
        deleteEmployee: {
            type: EmployeeType,
            args: {
                id: { type: GraphQLID }
            },
            async resolve(parent, args) {
                return Employee.findByIdAndDelete(args.id);
            }
        }
    }
});





module.exports = new GraphQLSchema({ query: RootQuery, mutation: Mutation });
