import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { error } from './error.js'

dotenv.config()

export const user_authentication = (req, res, next) => {
    try {
        const token = req.headers['x-api-key']

        if (!token) return res.status(400).send({ status: false, msg: "Token is required!" })

        const decoded = jwt.verify(token, process.env.JWT_token)
        if (!decoded) return res.status(400).send({ status: false, msg: "Invalid token" })

        // Attach user id to request so controllers can use req.user.id
        req.user = { id: decoded.id }

        next()
    }
    catch (e) { error(e, res) }
}

export const user_authorization = (req, res, next) => {
    try {
        const token = req.headers['x-api-key']
        const id = req.params.id;

        if (!id) return res.status(400).send({ status: false, msg: "Id is required!" })
        if (!token) return res.status(400).send({ status: false, msg: "Token is required!" })

        const decoded = jwt.verify(token, process.env.JWT_token)
        if (decoded.id !== id) return res.status(400).send({ status: false, msg: "Invalid token" })

        req.user = { id: decoded.id }

        next()
    }
    catch (err) { error(err, res) }
}