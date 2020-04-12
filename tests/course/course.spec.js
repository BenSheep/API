'use-strict';

const chai = require('chai');
// configuration file that includes env options
const config = require('../../config');
// eslint-disable-next-line no-unused-vars
const should = chai.should();

// get the dev api url
const url = config.dev.url;
// testing framework for HTTP requests
const request = require('supertest')(url);

const { logInWithValidCredentials } = require('../functions');
const User = require('../../api/models/userModel');
const Course = require('../../api/models/courseModel');

describe('get my courses', () => {
    const USER_ID = 1;
    const COURSE_NAME = 'networks';

    before('create course for user', async (done) => {
        createCourse(USER_ID, COURSE_NAME);
        done();
    });

    it("retrieves a list of the user's courses", (done) => {
        logInWithValidCredentials().end((err, res) => {
            if (err) {
                throw new Error(err);
            }

            const token = res.body.data.login.token;
            // we delete all users and create just one during the test suite. We are confident that said user will have id = 1;
            const query = `query {
                courses(userId: ${USER_ID}) {
                    name
                }
            }`;

            request
                .post('/graphql')
                .send({ query })
                .set('Authorization', 'Bearer ' + token)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        throw new Error(err);
                    }

                    res.body.data.courses.should.be.a('array');
                    res.body.data.courses[0].should.have.property('name');
                    res.body.data.courses[0].name.should.equal(COURSE_NAME);
                    done();
                });
        });
    });
});

const createCourse = async (userId, courseName) => {
    const course = new Course({ user_id: userId, name: courseName });

    await deleteCourses();

    return await course.save();
};

const deleteCourses = async () => {
    return Course.deleteMany({}, (err) => {
        if (err) {
            throw new Error(err);
        }
    });
};
