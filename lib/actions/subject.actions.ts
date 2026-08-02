'use server'

import { ISubjectService, GetSubjectsProps, CreateSubjectDto, UpdateSubjectDto } from "@/types";
import { LocalSubject } from "./providers/local.subject";

const getSubjectProvider = (): ISubjectService => {
    return new LocalSubject();
};

const subjectProvider = getSubjectProvider();

export const getSubjects = subjectProvider.getSubjects.bind(subjectProvider);
export const getSubjectById = subjectProvider.getSubjectById.bind(subjectProvider);
export const createSubject = subjectProvider.createSubject.bind(subjectProvider);
export const updateSubject = subjectProvider.updateSubject.bind(subjectProvider);
export const deleteSubject = subjectProvider.deleteSubject.bind(subjectProvider);
