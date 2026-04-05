const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type:String, required:[true,"First name required"], trim:true },
  lastName:  { type:String, required:[true,"Last name required"],  trim:true },
  email:     { type:String, required:[true,"Email required"], unique:true, lowercase:true, trim:true, match:[/^\S+@\S+\.\S+$/,"Valid email required"] },
  password:  { type:String, required:[true,"Password required"], minlength:[6,"Min 6 chars"], select:false },
  role:         { type:String, enum:["employee","manager","owner"], default:"employee" },
  position:     { type:String, default:"" },
  availability: { type:String, enum:["Full-Time","Part-Time","On-Call"], default:"Full-Time" },
  availabilitySchedule: {
    Mon:{morning:Boolean,afternoon:Boolean,evening:Boolean},
    Tue:{morning:Boolean,afternoon:Boolean,evening:Boolean},
    Wed:{morning:Boolean,afternoon:Boolean,evening:Boolean},
    Thu:{morning:Boolean,afternoon:Boolean,evening:Boolean},
    Fri:{morning:Boolean,afternoon:Boolean,evening:Boolean},
    Sat:{morning:Boolean,afternoon:Boolean,evening:Boolean},
    Sun:{morning:Boolean,afternoon:Boolean,evening:Boolean},
  },
  isActive:        { type:Boolean, default:true  },
  lastAttendance:  { type:Date,    default:null   },
  noShows:         { type:Number,  default:0      },
  coveragePercent: { type:Number,  default:100    },
  avatar:          { type:String,  default:null   },
  googleId:        { type:String,  default:null   },

  // Org hierarchy
  createdBy: { type:mongoose.Schema.Types.ObjectId, ref:"User", default:null },
  orgOwner:  { type:mongoose.Schema.Types.ObjectId, ref:"User", default:null }, // root owner of org

  // Subscription
  subscriptionStatus: { type:String, enum:["free","active","past_due","cancelled"], default:"free" },
  subscriptionPlan:   { type:String, enum:["free","pro"], default:"free" },
  stripeCustomerId:   { type:String, default:null },

  // Password reset
  resetPasswordToken:  { type:String },
  resetPasswordExpire: { type:Date   },
}, { timestamps:true });

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await require("bcryptjs").hash(this.password, await require("bcryptjs").genSalt(10));
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return await require("bcryptjs").compare(entered, this.password);
};

userSchema.virtual("name").get(function() {
  return `${this.firstName} ${this.lastName}`;
});
userSchema.set("toJSON", { virtuals:true });

module.exports = mongoose.model("User", userSchema);