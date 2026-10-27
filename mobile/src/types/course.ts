export interface Course {
  id: string;
  code: string;
  name: string;
  colour: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCourseInput {
  code: string;
  name: string;
  colour: string;
}

export interface UpdateCourseInput {
  code: string;
  name: string;
  colour: string;
}
