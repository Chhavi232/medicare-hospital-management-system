import mongoose from "mongoose";

export const connectDB = async() =>{
    await mongoose.connect("mongodb+srv://cmittalbe23_db_user:JnF08M35ZuyKVg40@cluster0.3pzylbw.mongodb.net/MediCare")
    .then(()=> {
        console.log("DB CONNECTED")
    })
}