const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Ticket, TicketMouvement } = require("../models/models");
const checkAuth = require("../middleware/check-auth");
const checkAuthAdmin = require("../middleware/check-auth-admin")

const qrGenerate = require("../functions/createQr");
const { Op } = require("sequelize");

function error(res, err) {
    return res.status(500).json({ error: err });
}

router.post("/createone", checkAuthAdmin, (req, res, next) => {
    Ticket.create()
        .then((result) => {
            const id = result.idTicket;
            const data = {
                blabla: result.qrTextTicket,
            };
            res.status(201).json({ result: data, message: "Ticket created" })
        })
        .catch((err) => {
            error(res, err);
        });
});

router.post("/createmulti", checkAuthAdmin, (req, res, next) => {
    const nombre = req.body.nombre;
    var success = 0;
    var erreur = 0;
    var erreurQR = 0;
    for (let index = 0; index < nombre; index++) {
        Ticket.create()
            .then((result) => {
                const id = result.idTicket;
                const resss = qrGenerate(id, data);

                success++;
            })
            .catch((err) => {
                erreur++;
            });
    }
    res.status(201).json({
        result: {
            nombre: nombre,
            success: success,
            erreur: erreur
        },
    });
});

router.get("/all", checkAuthAdmin, (req, res, next) => {
    Ticket.findAll( {order: [["idTicket", "ASC"]],})
        .then((result) => {
            res.status(200).json({ result: result });
        })
        .catch((err) => {
            res.status(500).json({ error: err });
        });
});

router.get("/part/:start/:end", checkAuthAdmin, (req, res, next) => {
    const start = req.params.start;
    const end = req.params.end;
    console.log(start, end);
    Ticket.findAll({
        where: {
            idTicket: {
                [Op.between]: [start, end],
            },
        },
        order: [["idTicket", "ASC"]],
    })
        .then((result) => {
            res.status(200).json({ result: result });
        })
        .catch((error) => {
            res.status(500).json({ error: error });
        });
});

router.post("/enter-ticket", checkAuth, (req, res, next) => {
    if (req.userData.userType == "userFEnter") {
        try {
            const { data } = req.body
            const jsonData = JSON.parse(data)
            const uuid = jsonData.blabla

            Ticket.findOne({ where: { qrTextTicket: uuid }})
            .then(result => {
                if (result === null) {
                    // Billet inexistant
                    res.status(400).json({ message: "Billet Innexistant" })
                } else {
                    if (result.payerTicket === false) {
                        // Billet non payer
                        res.status(405).json({ message: "Billet non payer" })
                    } else {
                        if (result.statusTicket == "none" || result.statusTicket == "exit") {
                            Ticket.update({ statusTicket: "enter" }, {where: { qrTextTicket: uuid }})
                            .then(resultT => {
                                TicketMouvement.create({
                                    device: req.userData["user-agent"],
                                    user: req.userData.idUser,
                                    action: "enter",
                                    ticket: uuid
                                })
                                .then(resultY => {
                                    res.status(200).json({ message: "Entrer autoriser" })
                                })
                                .catch(err => {
                                    error(res, err)
                                })
                            })
                            .catch(err => { 
                                error(res, err)
                            })
                        } else {
                            res.status(406).json({ message: "Billet deja entree" })
                        }
                    }
                }
            })
            .catch(err => {
                res.status(407).json({ message: "QR Code Error" })
            })
        } catch (err) {
            error(res, err)
        }
    } else {
        res.status(403).json({ message: "Not enough priviliege" })
    }
})

router.post("/exit-ticket", checkAuth, (req, res, next) => {
    if (req.userData.userType == "userFExit") {
        try {
            const { data } = req.body
            const jsonData = JSON.parse(data)
            const uuid = jsonData.blabla

            Ticket.findOne({ where: { qrTextTicket: uuid }})
            .then(result => {
                if (result === null) {
                    // Billet inexistant
                    res.status(400).json({ message: "Billet Innexistant" })
                } else {
                    if (result.payerTicket === false) {
                        // Billet non payer
                        res.status(405).json({ message: "Billet non payer" })
                    } else {
                        if (result.statusTicket == "enter") {
                            Ticket.update({ statusTicket: "exit" }, {where: { qrTextTicket: uuid }})
                            .then(resultT => {
                                TicketMouvement.create({
                                    device: req.userData["user-agent"],
                                    user: req.userData.idUser,
                                    action: "exit",
                                    ticket: uuid
                                })
                                .then(resultY => {
                                    res.status(200).json({ message: "Sortie autoriser" })
                                })
                                .catch(err => {
                                    error(res, err)
                                })
                            })
                            .catch(err => { 
                                error(res, err)
                            })
                        } else {
                            res.status(406).json({ message: "Billet pas encore entrer" })
                        }
                    }
                }
            })
            .catch(err => {
                res.status(407).json({ message: "QR Code Error" })
            })
        } catch (err) {
            error(res, err)
        }
    } else {
        res.status(403).json({ message: "Not enough priviliege" })
    }
})

module.exports = router;
