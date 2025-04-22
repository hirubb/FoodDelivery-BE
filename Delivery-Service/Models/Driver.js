const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const vehicleWithUserSchema = new mongoose.Schema({
    user: {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        mobile: {
            type: String,
            required: true
        },
        age: {
            type: Number,
            required: true,
            min: 18
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true
        },
        profileImage: {
            type: String,
            default: ''
        },
        available: {
            type: Boolean,
            default: true
        }
    },
    vehicle: {
        vehicleType: {
            type: String,
            default: ''
        },
        vehicleModel: {
            type: String,
            default: ''
        },
        manufactureYear: {
            type: Number,
            default: null
        },
        licensePlate: {
            type: String,
            default: null,

        },
        images: {
            frontView: {
                type: String,
                default: ''
            },
            sideView: {
                type: String,
                default: ''
            }
        },
        documents: {
            insurance: {
                file: {
                    type: String,
                    default: ''
                },
                expiryDate: {
                    type: Date,
                    default: null
                },
                verified: {
                    type: Boolean,
                    default: false
                }
            },
            revenueLicense: {
                file: {
                    type: String,
                    default: ''
                },
                expiryDate: {
                    type: Date,
                    default: null
                },
                verified: {
                    type: Boolean,
                    default: false
                }
            },
            driverLicense: {
                frontFile: {
                    type: String,
                    default: ''
                },
                backFile: {
                    type: String,
                    default: ''
                },
                expiryDate: {
                    type: Date,
                    default: null
                },
                verified: {
                    type: Boolean,
                    default: false
                }
            },
            emissionCertificate: {
                file: {
                    type: String,
                    default: ''
                },
                expiryDate: {
                    type: Date,
                    default: null
                },
                verified: {
                    type: Boolean,
                    default: false
                }
            }
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        }
    }
}, {
    timestamps: true
});




// Hash password before saving
vehicleWithUserSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('user.password')) {
        user.user.password = await bcrypt.hash(user.user.password, 8);
    }

    next();
});



// Check password
vehicleWithUserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.user.password);
};



const VehicleWithUser = mongoose.model('VehicleWithUser', vehicleWithUserSchema);

module.exports = VehicleWithUser;
