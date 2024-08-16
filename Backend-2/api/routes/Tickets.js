const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Ticket, TicketMouvement } = require("../models/models");
const checkAuth = require("../middleware/check-auth");

function error(res, err) {
    return res.status(500).json({ error: err });
}

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
