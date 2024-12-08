//PRACTICA 4 JUAN CARLOS 03-12-2024

import { MongoClient , ObjectId } from "mongodb";
import {UserModel,User,ProjectModel,Project,TaskModel,Task} from "./types.ts";
import { fromProjectModelToProject,fromTaskModelToTask,fromUserModelToUser } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_DB");
if (!MONGO_URL) {
  console.error("MONGO URL API KEY NOT WORKING");
  Deno.exit(1);
}


const dbuser = new MongoClient(MONGO_URL);
await dbuser.connect();
console.info("Connected to MongoDB");


const db = dbuser.db("BBDD-Proyectos");
const userCollection = db.collection<UserModel>("Users");
const taskCollection = db.collection<TaskModel>("Tareas");
const projectCollection = db.collection<ProjectModel>("Proyectos");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (method === "GET") {
    if (path === "/users") {
      const usersDB = await userCollection.find().toArray();
      const users = await Promise.all(
        usersDB.map((UserModel) => fromUserModelToUser(UserModel))
      );
      return new Response(JSON.stringify(users), {
        headers: { "content-type": "application/json" },
      });
    }else if (path === "/projects") {
      const projectsDB = await projectCollection.find().toArray();
      const projects = await Promise.all(
        projectsDB.map((ProjectModel) => fromProjectModelToProject(ProjectModel))
      );
      return new Response(JSON.stringify(projects), {
      });
    }else if (path === "/tasks") {
      const tasksDB = await taskCollection.find().toArray();
      const tasks = await Promise.all(
        tasksDB.map((taskModel) => fromTaskModelToTask(taskModel))
      );
      return new Response(JSON.stringify(tasks), {
      });
    }else if (path === "/projects/by-user") {
      const user_id = url.searchParams.get('user_id');
      if(!user_id) return new Response("Bad Request", {status: 404});
      const userid = new ObjectId(user_id);

      const projectsdb = await projectCollection.find({user_id: userid}).toArray();
      const projects = await Promise.all(projectsdb.map(p => fromProjectModelToProject(p)));
      return new Response(JSON.stringify(projects), {status: 200});

    }else if (path === "/tasks/by-project") {
      const project_id = url.searchParams.get('project_id');
      if(!project_id) return new Response("Bad Request", {status: 404});
      const projectid = new ObjectId(project_id); 

      const tasksdb = await taskCollection.find({project_id: projectid}).toArray();
      const tasks = await Promise.all(tasksdb.map(t => fromTaskModelToTask(t)));
      return new Response(JSON.stringify(tasks), {status: 200});

    }


  }else if (method === "POST") {
    if(path === "/users"){
      const user = await req.json();
      if(!user.name || !user.email){
        return new Response("Bad request", { status: 400 });
      }

      const userDB = await userCollection.findOne({ email: user.email });
      if(userDB) return new Response("Usuario ya registrado", { status: 409 });

      const { insertedId } = await userCollection.insertOne({
        name: user.name,
        email: user.email,
        created_at: new Date()
      });

      return new Response(JSON.stringify({
        name: user.name,
        email: user.email,
        created_at: new Date(),
        id: insertedId
      }), { status: 201 });
    }else if(path === "/projects"){
      const project = await req.json();
      if(!project.name || !project.description || !project.start_date || !project.user_id){
        return new Response("Bad request", { status: 400 });
      }

      const idUser = await userCollection.find({ _id: project.user_id });
      if(!idUser) return new Response("Usario no encontrado", { status: 404 });

      const { insertedId } = await projectCollection.insertOne({
        name: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        user_id: new ObjectId(project.user_id as string)
      });

      return new Response(JSON.stringify({
        name: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        user_id: project.user_id,
        id: insertedId
      }), { status: 201 });
      

    }else if (path === "/tasks"){
      const task = await req.json();
      if(!task.title || !task.status || !task.due_date || !task.project_id){
        return new Response("Bad request", { status: 400 });
      }

      const idProject = await projectCollection.find({ _id: task.project_id });
      if(!idProject) return new Response("Proyecto no encontrado", { status: 404 });

      const { insertedId } = await taskCollection.insertOne({
        title: task.title,
        description: task.description,
        status: task.status,
        created_at: new Date(),
        due_date: task.due_date,
        project_id: task.project_id
      });

      return new Response(JSON.stringify({
        title: task.title,
        description: task.description,
        status: task.status,
        created_at: new Date(),
        due_date: task.due_date,
        project_id: task.project_id,
        id: insertedId
      }), { status: 201 });


    }else if (path === "/tasks/move"){
      const task = await req.json();
      if(!task.task_id || !task.destination_project_id){
        return new Response("Bad request", { status: 400 });
      }

      const idTask = await taskCollection.find({ _id: task.task_id });
      if(!idTask) return new Response("Tarea no encontrada", { status: 404 });

      const idProject = await projectCollection.find({ _id: task.destination_project_id });
      if(!idProject) return new Response("Proyecto no encontrado", { status: 404 });

      const { modifiedCount } = await taskCollection.updateOne(
        { _id: new ObjectId(task.task_id as string) },
        { $set: { project_id: task.destination_project_id } }
      );

      if(modifiedCount === 0) return new Response("Task not moved", { status: 400 });

      return new Response(JSON.stringify({
        message: "Task moved successfully",
        task: {
          id: task._id,
          title: task.title,
          project_id: task.destination_project_id
        }
      }), { status: 200 });
    }
    
  }else if (method === "DELETE") {
    if(path === "/users"){
      const id = url.searchParams.get("id");
      if(!id) return new Response("Bad request", { status: 400 });

      const deletedUser = await userCollection.deleteOne({ _id: new ObjectId(id) });
      if(deletedUser.deletedCount === 0) return new Response("Usuario no encontrado", { status: 404 });
      return new Response("Userio eliminado", { status: 200 });
      
  }else if (path === "/projects"){
    const id = url.searchParams.get("id");
    if(!id) return new Response("Bad request", { status: 400 });

    const deletedProject = await projectCollection.deleteOne({ _id: new ObjectId(id) });
    if(deletedProject.deletedCount === 0) return new Response("Proyecto no encontrado", { status: 404 });
    return new Response("Proyecto eliminado", { status: 200 });

  }else if (path === "/tasks"){
    const id = url.searchParams.get("id");
    if(!id) return new Response("Bad request", { status: 400 });

    const deletedTask = await taskCollection.deleteOne({ _id: new ObjectId(id) });
    if(deletedTask.deletedCount === 0) return new Response("Tarea no encontrada", { status: 404 });
    return new Response("Tarea eliminada", { status: 200 });
    }
  }
}

Deno.serve({ port: 3001 }, handler);
