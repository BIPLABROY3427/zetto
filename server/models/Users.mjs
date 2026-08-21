import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, required: true },
});

const Users = mongoose.model("Users", UserSchema);

export default Users;

