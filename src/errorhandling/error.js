export const error = (err, res) => {
    console.log(err)
    if (err.name === 'JsonWebTokenError') return res.status(400).send({ status: false, msg: 'Invalid Token' })
    if (err.name === "ValidationError") return res.status(400).send({ status: false, msg: err.message })
    if (err.name === "CastError") return res.status(400).send({ status: false, msg: 'Invalid mongoose Id' })
    if (err.code === 11000) {
        return res.status(400).send({ status: false, msg: `Duplicate value at ${Object.keys(err.keyValue)} : ${Object.values(err.keyValue)}` })
    }
    return res.status(500).send({ status: false, msg: err.message })
}
