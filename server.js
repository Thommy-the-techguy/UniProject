if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;

const express = require('express');
const app = express();
const fs = require('fs');
const stripe = require('stripe')(stripeSecretKey);

const mysql = require('./views/database.js');
const alert = require('alert');

//
let authenticated = false;
let isAdmin = false;
//


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('frontend'));

//
app.use(express.urlencoded({ extended: false }));
//

app.get('/', checkAuthenticated, function(request, response) {
    mysql.query("SELECT * FROM `items`", function(error, data) {
        if (error) {
            response.status(500).end();
            throw error;
        } else {
            response.render('index.ejs', {
            stripePublicKey: stripePublicKey,
            sampleData: data
            });
        }
    });
});

app.post('/purchase', function(request, response) {
    let total = 0;

    let id = request.body.items;
    mysql.query("SELECT price FROM `items` WHERE id = ?", [id], function(error, result, fields) {
        if (!error) {
            total = +(result[0][Object.keys(result[0])[0]]);
                    
            stripe.charges.create({
                amount: total,
                currency: 'usd',
                source: request.body.stripeTokenId
            }).then(function() {
                console.log('Charge Successful');
                response.json({ message: 'Successfully purchased items' });
            }).catch(function(e) {
                switch (e.type) {
                    case 'StripeCardError':
                        console.log(`A payment error occurred: ${e.message}`);
                        break;
                    case 'StripeInvalidRequestError':
                        console.log('An invalid request occurred.');
                        break;
                    default:
                        console.log('Another problem occurred, maybe unrelated to Stripe.');
                        break;
                }
            })
        } else {
            response.status(500).end();
            console.log('An Error Occured!');
        }
    });
});



app.get('/login', function(req, res) {
    isAdmin = false;
    authenticated = false;
    res.render('./frontend/login.html');
});

app.get('/register', function(req, res) {
    res.render('./frontend/create-account-form.hmtl');
});

app.post('/login', function(req, res) {
    let login = req.body.login;
    let password = req.body.password;
    mysql.query("SELECT * FROM `users` where login = ? and password = ?", [login, password], function(error, result, fields) {
        if (result.length > 0) {
            
            if (result[0][Object.keys(result[0])[3]] === 'admin') {
                isAdmin = true;
                res.redirect("/admin/");
                alert(`Вход выполнен успешно. Здравствуйте администратор ${login}`);
                console.log('SignIn as Administrator Sucessfull.');
            } else {
                res.redirect("/");
                alert(`Вход выполнен успешно. Здравствуйте ${login}`);
                console.log('SignIn Sucessfull.');
                authenticated = true;
            }
        } else {
            res.redirect("/login.html");
            alert('Неверный логин и/или пароль.');
            console.log('SignIn Failed');
        }
        res.end();
    });
});

app.post('/register', function(req, res) {
    let login = req.body.login;
    let password = req.body.password;
    mysql.query("INSERT INTO `users` (login, password) VALUES (?, ?)", [login, password], function(error, result, fields) {
        if (!error) {
            res.redirect("login.html");
            alert('Регистрация прошла успешно.');
            console.log('Register Successfull');
        } else {
            res.redirect("/create-account-form.html");
            alert('Необходимо ввести логин и/или пароль в соответствии с требованиями.');
            console.log('Register Failed');
        }
    });
});

function checkAuthenticated(req, res, next) {
    if (authenticated) {
        return next();
    }

    res.redirect('/login.html');
}

function checkNotAuthenticated(req, res, next) {
    if (authenticated) {
      return res.redirect('/');
    }
    next();
}

//
 //Admin Page  
//

function checkIfAdmin(req, res, next) {
    if (isAdmin) {
        return next();
    }
    
    res.redirect('/login.html');
}

app.get('/admin', checkIfAdmin, function(req, res) {
    mysql.query("SELECT * FROM `items`", function(error, data) {
        if (error) {
            res.status(500).end();
            throw error;
        } else {
            res.render('admin.ejs', {
                sampleData: data
            });
        }
    })
});

app.post('/adminPostDelete', checkIfAdmin, function(req, res) {
    let id = req.body.idInput;
    mysql.query("DELETE FROM `items` WHERE id = ?", [id], function(error, result, fields) {
        if (!error) {
            res.redirect("/admin/");
            alert(`Запись с id ${id} была успешно удалена.`);
            console.log(`Movie with id ${id} deleted successfully!`);
        } else {
            res.redirect("/admin/");
            alert('Произошла неизвестная ошибка при удалении, проверьте id.');
            console.log(`Error item with id ${id} wasn't deleted!`);
        }
    });
});

app.post('/adminPostAdd', checkIfAdmin, function(req, res) {
    let name = req.body.nameInput;
    let price = req.body.priceInput;
    let imgName = req.body.imgNameInput;
    mysql.query("INSERT INTO `items` (name, price, imgName) VALUES (?, ?, ?)", [name, price, imgName], function(error, result, fields) {
        if (!error) {
            res.redirect("/admin/");
            alert(`Фильм ${name} был успешно добавлен.`);
            console.log(`Movie with name ${name} was added successfully`);
        } else {
            res.redirect("/admin/");
            alert(`Произошла неизвестная ошибка при добавлении.`);
            console.log(`Error item with name ${name} wasn't added!`);
        }
    });
});

app.post('/adminPostRedact', checkIfAdmin, function(req, res) {
    let id = req.body.idInputRedact;
    let name = req.body.nameInputRedact;
    let price = req.body.priceInputRedact;
    let imgName = req.body.imgNameInputRedact;
    mysql.query("UPDATE `items` SET name = ?, price = ?, imgName = ? WHERE id = ?", [name, price, imgName, id], function(error, result, fields) {
        if (!error) {
            res.redirect("/admin/");
            alert(`Запись с id ${id} была изменена успешно.`);
            console.log(`Item with id ${id} was redacted successfully.`);
        } else {
            res.redirect("/admin/");
            alert(`Произошла неизвестная ошибка при редактировании. Проверьте id.`);
            console.log(`Item with id ${id} wasn't changed due to the error!`);
        }
    });
});

app.listen(8081);

console.log('Server running at localhost:8081');

module.exports = app;