const qr = require("qrcode")


const generateQr = (id, data) => {
    const stJson = JSON.stringify(data);
    const result = qr.toFile("qr/"+id+".png", stJson, function (err, code) {
        if (err) {
            return "error"
        }
        return "created"

    })
    return result
}

module.exports = generateQr