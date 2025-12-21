class User {
    constructor(username, password, displayName, age, gender) {
        this.username = username;
        this.displayName = displayName || username;
        this.password = password;
        this.age = age;
        this.gender = gender;
        this.isAdmin = false;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    validate() {
        // Required fields
        if (!this.username) {
            throw new Error('Username is required');
        } else if (typeof this.username !== 'string') {
            throw new Error('Username must be a string');
        }

        if (!this.password) {
            throw new Error('Password is required');
        } else if (typeof this.password !== 'string') {
            throw new Error('Password must be a string');
        } else if (this.password.length < 4) {
            throw new Error('Password must be 4 characters or more');
        }


        // Optional fields validation
        if ((this.displayName !== undefined && this.displayName !== null) && typeof this.displayName !== 'string') {
            throw new Error('DisplayName must be a string');
        }

        if (this.age !== undefined && this.age !== null) {
            if (typeof this.age !== 'number' || this.age <= 0 || !Number.isInteger(this.age)) {
                throw new Error('Age must be a positive integer');
            }
        }
        if (this.gender !== undefined && this.gender !== null) {
            if (typeof this.gender !== 'string') {
                throw new Error('Gender must be a string');
            }
            const allowedGenders = ['male', 'female', 'other'];
            if (!allowedGenders.includes(this.gender.toLowerCase())) {
                throw new Error('Gender must be male, female, or other');
            }
        }

        if (this.isAdmin !== undefined && this.isAdmin !== null) {
            if (typeof this.isAdmin !== 'boolean') {
                throw new Error('isAdmin must be a boolean');
            }
        }

        return true;
    }
}

class UpdateUser extends User {
    constructor(username, password, displayName, age, gender, isAdmin,  createdAt) {
        super(username, password, displayName, age, gender);
        this.createdAt = createdAt;
        this.isAdmin = isAdmin;
        this.updatedAt = new Date().toISOString();
    }
}


module.exports = { User, UpdateUser };
