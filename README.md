# Api starter app
This app is meant to be used as a starting point for creating backend APIs.
The app is a simple express app with built in token authentication for users.

## Running

1. Clone the repository.
2. Run `npm install`.
3. If running in a dev environment, set up the mongo db.
    1. Create the following directory paths in your home folder:
        - `~/mongodb/<api-name>/data/db`
        - `~/mongodb/<api-name>/logs`
    3. Update the mongo conf file in `/models/mongod.conf`. The `path` and `dbpath` variables should point to paths you just created.
4. In a new terminal window run `npm run mongo` to start the mongdb database.
    1. In order to later stop the mongo database run `npm run mongo-stop`.
5. In the same window run `npm run start` to start the api.

## Routes

### Login

```
POST /auth/login
body
    {
      email,
      password
    }
Returns
    {
      token: (token)
    }
```

### Create user

```
POST /users
body:
    {
      email,
      password
    }
Returns
    {
      token: (token)
    }
```

### Get user

```
GET /users
body:
    token (can also be in the header as 'x-access-token')
Returns
    user object
```

### Update user

```
PUT /users
body:
    token (can also be in the header as 'x-access-token'),
    The body should contain the updated user object
Returns
    nothing
```

### Delete user

```
DELETE /users
body:
    token (can also be in the header as 'x-access-token')
Returns
    nothing
```