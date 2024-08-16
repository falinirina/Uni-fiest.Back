const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, userOTPVerification } = require("../models/models");
const nodemailer = require("nodemailer");
const saltRounds = 10
// Mail Config
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
})
transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready for message");
        console.log(success);
    }
})

// Authentification
const checkAuth = require("../middleware/check-auth");
const checkAuthAdmin = require("../middleware/check-auth-admin")

function error(res, err) {
    return res.status(500).json({ error: err });
}

router.post("/verify-token-admin", checkAuth, (req, res, next) => {
    res.status(200).json({message: "Success"})
})

router.post("/verify-token", checkAuth, (req, res, next) => {
    res.status(200).json({message: "Success", data: req.userData.userType })
})

router.post("/user-signin", (req, res, next) => {
    User.findOne({ where: { emailUser: req.body.email } })
    .then((result) => {
            const device = req.headers["user-agent"]
            if (result == null) {
                res.status(401).json({ message: "Auth failed" });
            } else {
                bcrypt.compare(
                    req.body.password,
                    result.passUser,
                    (err, result2) => {
                        // console.log(result2)
                        if (!result2) {
                            return res.status(401).json({
                                message: "Auth failed",
                            });
                        } else {
                            // Verify if device is already in Waiting
                            const id = result.idUser
                            const email = result.emailUser
                            userOTPVerification.findOne({where: {
                                device: device,
                                userId: id
                            }})
                            .then(resultT => {
                                if (resultT == null) {
                                    sendOTPVerificationEmail( id , email , device, res)
                                } else {
                                    // console.log(resultT.expiresAt);
                                    if (resultT.expiresAt < Date.now()) {
                                        userOTPVerification.destroy({ where: {
                                            id: resultT.id,
                                        }})
                                        .then(resultT2 => {
                                            sendOTPVerificationEmail( id , email , device, res)
                                        })
                                        .catch(err => {
                                            error(res, err)
                                        })
                                    } else {
                                        console.log("Not resent OTP")
                                        res.status(200).json({ message: "Not resend", data: {
                                                id: id,
                                                email: email
                                            } 
                                        })
                                    }
                                }
                            })
                            .catch(error2 => {
                                error(res, error2)
                            })

                        }
                    }
                );
            }
        })
        .catch((err) => {
            error(res, err);
        });
})

router.post("/resend-OTP", (req, res, next) => {
    
    const { id } = req.body
    const device = req.headers["user-agent"]

    userOTPVerification.findOne({ where: {
        userId: id,
        device: device
    }})
    .then(result => {
        
        if (result == null) {
            res.status(401).json({ message: "Reconnect please" })
        } else {
            const date = Date.parse(result.createdAt) + 60000
            // console.log( date, Date.now() );
            
            // const timeOut = date + 180000
            // res.status(200).json({mes: "sd"})
            if (date > Date.now()) {
                res.status(202).json({message: "Waiting timeout"})
            }
            else {
                userOTPVerification.destroy({ where: {
                    userId: id,
                    device: device
                }})
                .then(result => {
                    User.findOne({ where: {
                        idUser: id
                    }})
                    .then(result => {
                        const email = result.emailUser
                        // res.status(200).json({ id , email , device })
                        sendOTPVerificationEmail( id , email , device, res)
                    })
                    .catch(err => {
                        error(res, err)
                    })
                })
                .catch(err => {
                    error(res, err)
                })
            }
        }
    })
    .catch(err => {
        error(res, err)
    })
})

router.post("/verify-OTP", (req, res, next) => {
    try {
        const { id, otp } = req.body
        const device = req.headers["user-agent"]
        if (!id || !otp ) {
            error(res, "Not enough Arguments")
        } else {
            const idUserFF = id
            const otpNN = otp
            userOTPVerification.findOne({ where: { userId: id, device: device } })
            .then(result => {
                if (result == null) {
                    res.status(401).json({ message: "Please Resign up" });
                } else {
                    const newId = result.id
                    const { expiresAt, otp } = result
                    
                    if (expiresAt < Date.now()) {
                        userOTPVerification.destroy({ where: { id: newId } })
                        .then(result => {
                            res.status(401).json({ message: "OTP expired" })
                        })
                        .catch(error2 => {
                            error(res, "84")
                        })
                    } else {
                        bcrypt.compare(otpNN, otp, (err, resultH) => {
                            const newId = result.id
                            
                            if (!resultH) {
                                const trying = result.trying + 1
                                
                                if (trying < 3) {
                                    userOTPVerification.update({ trying: trying }, { where: { id: newId } 
                                    })
                                    .then(resultTT => {
                                        res.status(402).json({ message: "Invalid OTP" })
                                    })
                                    .catch(err => {
                                        error(res, err)
                                    })
                                } else {
                                    userOTPVerification.destroy({ where: { id: newId } })
                                    .then(result => {
                                        res.status(403).json({ message: "Trying 3" })
                                    })
                                    .catch(error2 => {
                                        error(res, "84")
                                    })
                                }
                            } else {
                                User.findOne({ where: { idUser: idUserFF } })
                                .then(ressss => {
                                    userOTPVerification.destroy({ where: { id: newId } })
                                    .then(result003 => {
                                        const token = jwt.sign(
                                            {
                                                email: ressss.emailUser,
                                                idUser: ressss.idUser,
                                                userType: ressss.roleUser,
                                                "user-agent": device
                                            },
                                            process.env.JWT_KEY,
                                            {
                                                expiresIn: "24h",
                                            }
                                        );
                                        res.status(200).json({message: "Authentication Success", token: token, type: ressss.roleUser })
                                    })
                                    .catch(error2 => {
                                        error(res, "84")
                                    })
                                })
                                .catch(err => {
                                    error(res, err)
                                })
                            }
                        })
                    }
                }
            })
            .catch(error2 => {
                error(res, error2)
            })
        }
    } catch (error2) {
        error(res, error2)
    }
})

router.post("/signup", checkAuthAdmin, (req, res, next) => {
    User.findOne({ where: { emailUser: req.body.email } })
        .then((result) => {
            if (result == null) {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        error(res, err);
                    } else {
                        User.create({
                            nomUser: req.body.nom,
                            prenomUser: req.body.prenom,
                            emailUser: req.body.email,
                            passUser: hash,
                            roleUser: req.body.role,
                        })
                            .then((result2) => {
                                res.status(201).json({ result: result2 });
                            })
                            .catch((err) => {
                                error(res, err);
                            });
                    }
                });
            } else {
                res.status(200).json({
                    message: "Email already existe",
                });
            }
        })
        .catch((err) => {
            res.status(500).json({ error: err });
        });
});

router.get("/", checkAuthAdmin, (req, res, next) => {
    const user = req.userData.idUser;
    User.findOne({ where: { idUser: user } })
        .then((result) => {
            // console.log(result);
            res.status(200).json({ result: result });
        })
        .catch((err) => {
            res.status(500).json({ error: err });
        });
});

router.get("/all", checkAuthAdmin, (req, res, next) => {
    User.findAll()
        .then((result) => {
            // console.log(result);
            res.status(200).json({ result: result });
        })
        .catch((err) => {
            res.status(500).json({ error: err });
        });
});


const sendOTPVerificationEmail = (id, email, device, res) => {
    try {
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`

        //mail options
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: "UNI-FIEST SERVER",
            html: `<p>This is your OTP password, please enter this into the App: <br><b>${otp}</b><p>This code expires in 1 hour</p></p>`
        }
        // Hashing OTP
        
        bcrypt.hash(otp, saltRounds, (err, hash) => {
            console.log(otp, hash)
            if (err) {
                error(res, err);
            } else {
                console.log(hash.length)
                userOTPVerification.create({
                    userId: id,
                    otp: hash,
                    device: device,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 3600000,
                })
                .then(result => {
                    transporter.sendMail(mailOptions)
                    res.status(200).json({
                        status: "PENDING",
                        message: "Please check your mail",
                        data: {
                            id: id,
                            email: email
                        }
                    })
                })
                .catch(error2 => {
                    error(res, error2)
                })
            }
        });
    } catch (error2) {
        error(res, error2)
    }
}

module.exports = router;
