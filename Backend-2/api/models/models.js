const { Sequelize, DataTypes, Model, TIME, UUID } = require("sequelize");

const sequelize = new Sequelize(process.env.POSTGRESL)

class User extends Model {}
User.init(
    {
        idUser: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nomUser: {
            type: DataTypes.STRING(100),
        },
        prenomUser: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        emailUser: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        passUser: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        verifiedUser: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        roleUser: {
            type: DataTypes.STRING(25),
            allowNull: false,
        },
        activeUser: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    },
    { sequelize }
);

class userOTPVerification extends Model {}
userOTPVerification.init({
    userId: {
        type: DataTypes.INTEGER,
    },
    otp: {
        type: DataTypes.STRING(100),
    },
    device: {
        type: DataTypes.STRING(150)
    },
    trying: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    createdAt: {
        type: DataTypes.DATE,
    },
    expiresAt: {
        type: DataTypes.DATE,
    }

}, {sequelize})

class trustedDevice extends Model {}
trustedDevice.init({
    userId: {
        type: DataTypes.INTEGER,
    },
    device: {
        type: DataTypes.STRING(150)
    },
}, {sequelize})

class Ticket extends Model {}
Ticket.init(
    {
        idTicket: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        qrTextTicket: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("uuid_generate_v4()"),
            unique: true,
        },
        payerTicket: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        statusTicket: {
            type: DataTypes.STRING(100),
            defaultValue: "none",
        },
        typeTicket: {
            type: DataTypes.STRING(10),
            defaultValue: "normal"
        }
    },
    { sequelize }
);

class TicketMouvement extends Model {}
TicketMouvement.init({
    device: {
        type: DataTypes.STRING(150)
    },
    user: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: "idUser"
        }
    },
    action: {
        type: DataTypes.STRING(100)
    },
    ticket: {
        type: DataTypes.UUID,
        references: {
            model: Ticket,
            key: "qrTextTicket"
        }
    }
}, {sequelize})

sequelize.sync();

exports.User = User;
exports.Ticket = Ticket;
exports.userOTPVerification = userOTPVerification;
exports.trustedDevice = trustedDevice
exports.TicketMouvement = TicketMouvement