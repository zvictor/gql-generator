const cp = require('child_process');
require('should');

test('validate generated queries', async () => {
  cp.execSync('node index.js --schemaFilePath ./example/sampleTypeDef.graphql --destDirPath ./example/output');
  const queries = require('../example/output');
  queries.mutations.signin.indexOf('signin').should.not.equal(-1);
  
  const expected = `query user($language: String, $id: Int!){
    user(id: $id){
        id
        username
        email
        createdAt
        context{
            domain
            card{
                number
                type{
                    key
                }
            }
        }
        details{
            ... on Guest {
                region(language: $language)
            }
            ... on Member {
                address
            }
            ... on Premium {
                location
                card{
                    number
                    type{
                        key
                    }
                }
            }
        }
    }
}`;
  should(queries.queries.user).be.equal(expected);
});

test('limit depth', async () => {
  cp.execSync('node index.js --schemaFilePath ./example/sampleTypeDef.graphql --destDirPath ./example/output2 --depthLimit 1');
  const queries = require('../example/output2');
  queries.mutations.signup.indexOf('createdAt').should.equal(-1);
});

test('excludes deprecated fields by default', async () => {
  cp.execSync('node index.js --schemaFilePath ./example/sampleTypeDef.graphql --destDirPath ./example/output3 --depthLimit 1');
  const queries = require('../example/output3');
  should(typeof queries.queries.user).be.exactly('string');
  should(queries.queries.members === undefined).be.true();
  should(queries.mutations.sendMessage === undefined).be.true();

  const expected = `query user($language: String, $id: Int!){
    user(id: $id){
        id
        username
        email
        createdAt
        details{
            ... on Guest {
                region(language: $language)
            }
            ... on Member {
                address
            }
            ... on Premium {
                location
            }
        }
    }
}`;

  should(queries.queries.user === expected).be.true();
});

test('includes deprecated fields with includeDeprecatedFields flag', async () => {
  cp.execSync('node index.js --schemaFilePath ./example/sampleTypeDef.graphql --destDirPath ./example/output4 --depthLimit 1 --includeDeprecatedFields');
  const queries = require('../example/output4');

  should(typeof queries.queries.user).be.exactly('string');
  should(typeof queries.queries.members).be.exactly('string');
  should(typeof queries.mutations.sendMessage).be.exactly('string');

  const expected = `query user($language: String, $id: Int!){
    user(id: $id){
        id
        username
        email
        createdAt
        details{
            ... on Guest {
                region(language: $language)
            }
            ... on Member {
                address
            }
            ... on Premium {
                location
            }
        }
        address
    }
}`;
  should(queries.queries.user === expected).be.true();
});

test('includes nested in union types', async () => {
  cp.execSync('node index.js --schemaFilePath ./example/sampleTypeDef.graphql --destDirPath ./example/output5 --depthLimit 2');
  const queries = require('../example/output5');

  should(typeof queries.queries.user).be.exactly('string');
  should(queries.queries.members === undefined).be.true();
  should(queries.mutations.sendMessage === undefined).be.true();

  const expected = `query user($language: String, $id: Int!){
    user(id: $id){
        id
        username
        email
        createdAt
        context{
            domain
        }
        details{
            ... on Guest {
                region(language: $language)
            }
            ... on Member {
                address
            }
            ... on Premium {
                location
                card{
                    number
                }
            }
        }
    }
}`;
  should(queries.queries.user).be.equal(expected);
});

test('includes cross reference with the --includeCrossReferences flag', async () => {
  cp.execSync('node index.js --schemaFilePath ./example/sampleTypeDef.graphql --destDirPath ./example/output6 --depthLimit 4 --includeCrossReferences');
  const queries = require('../example/output6');

  should(typeof queries.queries.user).be.exactly('string');
  should(queries.queries.members === undefined).be.true();
  should(queries.mutations.sendMessage === undefined).be.true();

  // The context domain field should be included multiple times
  const expected = `query user($language: String, $language1: String, $language2: String, $language3: String, $id: Int!){
    user(id: $id){
        id
        username
        email
        createdAt
        context{
            user{
                id
                username
                email
                createdAt
                context{
                    domain
                }
                details{
                    ... on Guest {
                        region(language: $language)
                    }
                    ... on Member {
                        address
                    }
                    ... on Premium {
                        location
                        card{
                            number
                        }
                    }
                }
            }
            domain
            card{
                number
                type{
                    key
                }
                owner{
                    id
                    username
                    email
                    createdAt
                    details{
                        ... on Guest {
                            region(language: $language1)
                        }
                        ... on Member {
                            address
                        }
                        ... on Premium {
                            location
                        }
                    }
                }
            }
        }
        details{
            ... on Guest {
                region(language: $language2)
            }
            ... on Member {
                address
            }
            ... on Premium {
                location
                card{
                    number
                    type{
                        key
                    }
                    owner{
                        id
                        username
                        email
                        createdAt
                        context{
                            domain
                        }
                        details{
                            ... on Guest {
                                region(language: $language3)
                            }
                            ... on Member {
                                address
                            }
                            ... on Premium {
                                location
                            }
                        }
                    }
                }
            }
        }
    }
}`;
  should(queries.queries.user).be.equal(expected);
});
