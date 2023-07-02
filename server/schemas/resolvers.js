const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (_, __, { user }) => {
            if(user) { 
                const userData = await User.findOne({ _id: user._id })
                .select('-__v -password');
                return userData;
            };
            throw new AuthenticationError('Not logged in.');
        },
    },
    Mutation: {
        addUser: async (_, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);

            return { token, user };
        },
        login: async (_, { email, password }) => {
            const user = await User.findOne({ email });

            if(!user) {
                throw new AuthenticationError('Incorrect credentials.');
            };

            const correctPw = await user.isCorrectPassword(password);
            if(!correctPw) {
                throw new AuthenticationError('Incorrect credentials.');
            }

            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (_, { book }, { user }) => {
            if(user) { 
                const updatedUser = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $addToSet: { savedBooks: book }},
                    { new: true }
                );
                return updatedUser;
            };
            throw new AuthenticationError('You need to be logged in!');
        },
        removeBook: async (_, { bookId }, { user }) => {
            if(user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $pull: { savedBooks: { bookId: bookId }}},
                    { new: true }
                );
                return updatedUser;
            }
        }
    }
};

module.exports = resolvers;