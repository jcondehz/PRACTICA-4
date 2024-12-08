import {ObjectId, OptionalId} from "mongodb";



//-------------------------------------------------------------------------------------------------------------------------------


export type User = { //User is the type of the user in the application
    id:string;
    name: string;
    email: string;
    created_at: Date;
}
export type UserModel = OptionalId<{ //UserModel is the type of the user in the database
    name: string;
    email: string;
    created_at: Date;

}>;
export type Project = {
    id: string;
    name: string;
    description: string;
    start_date?: Date;
    end_date?: Date;
    user_id: string;
}
export type ProjectModel = OptionalId<{
    name: string;
    description: string;
    start_date?: Date;
    end_date?: Date;
    user_id: ObjectId;
}>;

export type Task = {
    id:string;
    title: string;
    description: string;
    status: string;
    created_at?: Date;
    due_date?: Date;
    project_id: string;
}

export type TaskModel = OptionalId<{
    title: string;
    description: string;
    status: string;
    created_at: Date;
    due_date: Date;
    project_id: ObjectId;
}>;
