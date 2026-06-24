export const validname = (name) => {
    const nameRe = /^[A-Za-z ]{2,50}$/;
    return nameRe.test(name)
}

export const validEmail = (email) => {
    const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRe.test(email)
}

export const validpassword = (pass) => {
    // If password is already a bcrypt hash (starts with $2a$, $2b$, or $2y$ and is 60 chars long), it is valid.
    if (typeof pass === 'string' && pass.length === 60 && /^\$2[ayb]\$/.test(pass)) {
        return true;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(pass)
}
