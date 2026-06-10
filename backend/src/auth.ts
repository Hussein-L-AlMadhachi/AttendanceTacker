import "./load_env.js";
import jwt from 'jsonwebtoken';
import { type Metadata, type Validator, type ValidatorReturn } from 'enders-sync';
import { loggedin_users } from './db.js';
import { type Request, type Response } from 'express';


import { normalize_arabic } from './helpers/normalize_arabic.js';


interface TokenMetadata {
    user_id: number,
    role: string
}



const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';



export function generate_auth_validtor_for_roles(role: string): Validator {
    return (req: Request) => {
        try {
            if (!req?.cookies) {
                return { success: false };
            }

            const token = req.cookies["auth-token"];
            const decoded = jwt.verify(token, JWT_SECRET) as TokenMetadata;


            if (typeof decoded.user_id !== "number" || typeof decoded.role !== "string") {
                return {
                    success: false
                }
            }

            if (decoded.role !== role) {
                return {
                    success: false
                }
            }

            return {
                success: true,
                metadata: {
                    auth: {
                        user_id: decoded.user_id,
                        role: decoded.role
                    }

                }
            };

        } catch (error) {
            return { success: false };
        }
    }
}



export const auth = {
    admin: generate_auth_validtor_for_roles("admin"),
    superadmin: generate_auth_validtor_for_roles("superadmin"),
    teacher: generate_auth_validtor_for_roles("teacher"),
}



interface loggedIn {
    role: string,
    user_id: number,
}



export async function logout(metadata: Metadata) {
    metadata.res!.cookie("auth-token", "");
    metadata.res!.cookie("auth-role", "");
}

interface AccountInfo {
    id: number;
    username: string;
    role: string;
}

export async function getAccountInfo(metadata: Metadata): Promise<AccountInfo> {
    const uid = metadata.auth.user_id;

    if (typeof uid !== "number") {
        throw new Error("Unexpected error: user_id cannot be anythin but a number");
    }

    const [user] = await loggedin_users.fetch(uid);
    if (!user) {
        throw new Error("no user found");
    }

    return {
        id: user.id,
        username: user.username,
        role: user.role
    };
}


export async function login(
    metadata: Metadata, username: string | undefined, password: string | undefined
): Promise<loggedIn> {

    if (typeof password !== "string" || typeof username !== "string") {
        throw new TypeError("RPC expects a username:string , password:string as input")
    }

    const loginResult = await loggedin_users.loginWithLockout(
        normalize_arabic(username),
        password
    );

    if (loginResult.status === "locked") {
        throw new Error("account_locked");
    }

    if (loginResult.status !== "ok") {
        throw new Error("Unauthorized");
    }

    const user_id: number = loginResult.user.id;
    const user_role: string = loginResult.user.role;

    try {

        const token = jwt.sign(
            { role: user_role, user_id: user_id },
            JWT_SECRET,
            {
                expiresIn: '1d',
                issuer: `${user_role}-auth-service`,
                audience: user_role
            }
        );

        metadata.res!.cookie("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 1000 // 1 day
        });

        return {
            role: user_role,
            user_id: user_id
        };

    } catch (error) {
        throw new Error('Error creating token');
    }

}


export function isValidAdminNoRPC(req: Request, res: Response) {
    const validation = auth.admin(req);
    if (validation.success === false) {
        return null;
    }

    const _auth = validation.metadata?.auth;

    return _auth;
}


export function isValidTeacherNoRPC(req: Request, res: Response) {
    const validation = auth.teacher(req);
    if (validation.success === false) {
        return null;
    }

    const _auth = validation.metadata?.auth;

    return _auth;
}


export function isValidSuperadminNoRPC(req: Request, res: Response) {
    const validation = auth.superadmin(req);
    if (validation.success === false) {
        return null;
    }

    const _auth = validation.metadata?.auth;

    return _auth;
}


export function isValidAttendanceScannerNoRPC(req: Request, res: Response) {
    const teacher = isValidTeacherNoRPC(req, res);
    if (teacher) {
        return teacher;
    }

    const superadmin = isValidSuperadminNoRPC(req, res);
    if (superadmin) {
        return superadmin;
    }

    return null;
}

