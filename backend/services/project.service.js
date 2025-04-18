import projectModel from '../models/project.model.js';
import mongoose from 'mongoose';


export const createProject = async ({ name, userId }) => {
    if (!name) {
        throw new Error('Project name is required');
    }
    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
        const project = await projectModel.create({
            name,
            users: [userId]
        });

        return project;

    } catch (error) {
        if (error?.code === 11000) {  // Handle duplicate key error
            throw new Error('Project name already exists');
        }
        throw new Error('Error creating project: ' + error.message);
    }
};

export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('User ID is required');
    }

    const allUserProjects = await projectModel.find({ users: userId });
    return allUserProjects;
};

export const addUsersToProject = async ({ projectId, users ,userId}) => {
    if (!projectId) {
        throw new Error("projectId is required");
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId");
    }

    if (!users || !Array.isArray(users)) {
        throw new Error("users must be an array");
    }
    for (const userId of users) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error(`Invalid userId: ${userId}`);
        }
    }
    if(!userId){
        throw new Error("userId is required");
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new Error("Invalid userId")
    }

    // Proceed with your logic here
    const project=await projectModel.findOne({
        _id:projectId,
        users:userId,
    })

    if(!project){
        throw new Error("User not belong to this project")
    }


const updatedProject=await projectModel.findOneAndUpdate({
    _id:projectId
},{
    $addToSet:{
        users:{
            $each:users
        }
    }
},{
    new:true
})

return updatedProject
};

export const getProjectById=async({projectId})=>{
    if(!projectId){
        throw new Error("projectId is required")
    }
    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error("Invalid projectId")
    }
    const project =await projectModel.findOne({
        _id:projectId
    }).populate('users')
    return project
}
