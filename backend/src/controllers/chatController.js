import User from "../models/userModel.js";
import Message from "../models/chatModel.js"
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req , res) => {
  try{

    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({_id: {$ne:loggedInUserId}}).select("-password");

    res.status(200).json(filteredUsers)
  
  }catch(error){
    console.log("error in getUsersForSidebar controller", error.message)
    res.status(500).json({ message : "Internal Server Error"});
  }
};

export const getMessages = async(req,res) => {
  try{
    const {id: userToChatId} = req.params
    const MyId = req.user._id;

    const messages = await Message.find({
      $or: [
        {senderId:MyId, receiverId:userToChatId},
        {senderId: userToChatId, receiverId: MyId}
      ]
    })

    res.status(200).json(messages)
  }catch(error){
    console.log("error in getMessages controller", error.message)
    res.status(500).json({ message : "Internal Server Error"});
  }
};

export const sendMessage = async(req,res) => {
  try{
    const{ text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if(image){
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    //create message
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // save to database
    await newMessage.save();

    //realtime functionality goes here => socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    //sending a response back
    res.status(201).json( newMessage);
  }catch(error){
    console.log("error in sendMessages controller", error.message)
    res.status(500).json({ message : "Internal Server Error"});
  }
};