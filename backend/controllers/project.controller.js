import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import UserModel from '../models/user.model.js';
import { validationResult } from 'express-validator';

export const createProject = async (req, res) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Ensure user is authenticated
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: "Unauthorized. Please log in." });
        }

        // Get userId from logged-in user's email
        const loggedInUser = await UserModel.findOne({ email: req.user.email });
        if (!loggedInUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const { name } = req.body;
        const userId = loggedInUser._id;

        // Create the project using service function
        const newProject = await projectService.createProject({ name, userId });

        res.status(201).json({ message: "Project created successfully", project: newProject });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const getAllProject = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: "Unauthorized. Please log in." });
        }

        // Get userId from logged-in user's email
        const loggedInUser = await UserModel.findOne({ email: req.user.email });
        if (!loggedInUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const allUserProjects = await projectService.getAllProjectByUserId({ userId: loggedInUser._id });

        return res.status(200).json({
            projects: allUserProjects
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

export const addUserToProject=async (req,res)=>{
    const errors=validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    try{
        const {projectId,users}=req.body

        const loggedInUser=await UserModel.findOne({
            email:req.user.email
        })

        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId:loggedInUser._id
        })

        return res.status(200).json({
            project,
        })

    }catch(err){
        console.log(err)
        res.status(400).json({error:err.message})
    }
}

export const getProjectById=async(req,res)=>{
    const {projectId}=req.params;

    try{
        const project =await projectService.getProjectById({projectId});
        return res.status(200).json({
            project
        })
    }catch(err){
        console.log(err)
        res.status(400).json({error:err.message})
    }

}

