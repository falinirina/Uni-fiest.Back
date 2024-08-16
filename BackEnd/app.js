const express = require('express')
const app = express()

const morgan = require('morgan');
const bodyParser = require('body-parser');
const userRoutes = require("./api/routes/users")
const ticketRoutes = require("./api/routes/Tickets")

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())

// Prevent CORSE ERROR
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    // console.log(res.headers)
    res.header(
        'Access-Control-Allow-headers', 
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === "OPTIONS") {
        res.header(
            'Access-Control-Allow-Methods', 
            'PUT, POST, PATCH, DELETE, GET'
        );
        return res.status(200).json({});
    }
    next();
})

app.use("/api/users", userRoutes)
app.use("/api/tickets", ticketRoutes)

// Error Handling
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;

    next(error);
});

// Routes which should handle request
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
});

module.exports = app;