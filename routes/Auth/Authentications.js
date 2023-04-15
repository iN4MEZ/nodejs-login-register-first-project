const express = require('express');
const router = express.Router();
const users = require('../../db/users/users');
const mysql = require('mysql2');
const e = require('express');
const bcrypt = require('bcrypt');
const uuid = require('uuid');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: '3306',
    database: 'nmexdatabase'
});

const table = 'accounts'

const saltRounds = 10;

connection.connect((err) => {
    if (err) throw err;
    console.log('db Connected!');
    connection.query('SELECT * FROM accounts WHERE id = 1',(error,results,fields) => {
        if(error) {
            throw new Error(error);
        }
        //console.log(results);
    });
  });

// get all users
router.get('/users',(req,res) => {
    var query = connection.execute('SELECT * FROM accounts', (err,results,fields)=>{
        if(err) {
            throw new Error(err);
        }
        res.status(200).json(results);
    })
});

// Get single user

router.get('/users/:id',(req,res) =>{
    var query = connection.execute('SELECT * FROM accounts WHERE id = ' + req.params.id, (err,results,fields)=>{
        const found = results.some(user => user.id == req.params.id);
        if(err) {
            throw new Error(err);
        }
        if(found) {
            res.status(200).json(results);
        } else {
            res.status(400).json({ msg:"Not found User id :" + req.params.id});
        }
    })
});

// create user

router.post('/register',(req,res) => {
    const newUser = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    }
    bcrypt.hash(newUser.password, saltRounds, function(err, hash) {
        // Validation
        try {
            var queryGet = connection.execute('SELECT * FROM accounts', (err,resultsSend,fields)=>{
                if(err) { throw new Error(err)}
                var usedEmail_Name = resultsSend.some(user => newUser.email == user.email || newUser.username == user.username);
                if(!newUser) {
                    res.status(400).json({ msg:"Please put your username email and password"});
                    return;
                }
                if(usedEmail_Name) {
                    res.status(400).json({ msg:"Your Email or username already used"});
                    return;
                }
                    // insert form to database
                    var dbString =
                    "INSERT INTO "
                     + table + 
                     " (username, email, passwords ,uuid) VALUES ('" + newUser.username + "', '" + newUser.email + "', '" + hash + "', '" + uuid.v4() + "');";
                    var queryInsert = connection.execute(dbString,(err,results,fields) => {
                        if(err) { throw new Error(err)}
                res.json({ msg:"User has been created ",results});
                })
            });
        } catch(err) {
            throw new Error(err);
        }
    });
});

// edit user

router.put('/edit/:id',(req,res) => {

    // Connection to table
    var query = connection.execute('SELECT * FROM accounts WHERE id = ' + req.params.id, (err,results,fields)=>{
        const found = results.some(user => user.id == req.params.id);
        const userUpdate = req.body;

        // Data Validation
        const dataFilterValidation = results.map(users => {
            var dataFilter = {
                username: !userUpdate.username ? users.username : userUpdate.username,
                email: !userUpdate.email ? users.email : userUpdate.email,
                passwords: !userUpdate.passwords ? users.passwords : userUpdate.passwords,
            }
            return dataFilter;
        });

        // TODO: dataFilterValidation[0] Only
        const data = [dataFilterValidation[0].username,dataFilterValidation[0].email,dataFilterValidation[0].passwords,req.params.id];

        // Change Password Encrypted
        if(userUpdate.passwords !== undefined) {
            try {
                console.log("Yes");
                bcrypt.hash(dataFilterValidation[0].passwords,saltRounds,(err,hash) => {
                    data[2] = hash;
           
                });
            } catch(err) {
                throw new Error(err);
            }
        }
        // CallBack Fn
        setTimeout(() => {
            var sqlCommands = "UPDATE accounts SET username = ?, email = ?,passwords = ? WHERE id = ?";
                if(found) {
            var queryPut = connection.query(sqlCommands,data,(err,results,fields) =>{
                if(err) { throw new Error(err)}
                res.json("USER UPDATE!");
            })
                } else {
                res.status(400).json({ msg: "Not found ID"});
        }
        },1000)
    })
});


//DETETE USER

router.delete('/delete/:id',(req,res) => {
    // Query to database
    var query = connection.execute('SELECT * FROM accounts', (err,results,fields) => {
        try{
            const userTarget = results.find((user) => user.id == req.params.id);
            if(userTarget) {
                connection.query('DELETE FROM accounts WHERE id = ?;',[req.params.id],(err,results,fields) => {
                    if(err){ throw new Error(err);}
                    res.json({ msg: "User has been deteleted Id :" + req.params.id });
                });
            } else {
                res.status(404).json({ msg: "Error Not found user By id"});
            }
        } catch(err) {
            throw new Error(err);
        }
    });
});

// Login

// TODO: ERROR FOREACH YOU CODE NEED FUCKING IMPROVEMENT THIS  BULLSHIT

router.get('/login',(req,res) => {
    const userLogin = req.body
    var query = connection.execute('SELECT * FROM accounts', (err,results,fields)=>{

        if(!userLogin.username || !userLogin.passwords) {
            res.status(400).json("Error Paramiter");
            return;
        }

        if(err) {
            throw new Error(err);
        }

        const userFound = results.find((user) => user.username == userLogin.username);

        if(userFound) {
            var promise = new Promise((resolve,reject) => {
                var check = bcrypt.compare(userLogin.passwords, userFound.passwords,async (err, result) =>{
                    if(err) {
                        reject(err);
                    }
                    resolve(result);
                });
            }).then((success) => {
                if(success) {
                    res.status(200).json({ msg: "Welcome " + userFound.username, userdata: userFound});
                } else {
                    res.status(400).json({ msg: "รหัสผิดไอควาย"});
                }
            }).catch((err) =>{
                throw new Error(err);
            });
        } else {
            res.status(400).json({ msg: "Email or username ผิดนะไอสัส"});
        }
    })
});

module.exports = router;
