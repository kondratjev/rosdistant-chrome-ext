export interface ICourse {
  [id: string]: {
    name: string;
    form: string;
  };
}

export interface IGrade {
  min: number;
  max: number;
  result: string;
}

export interface IStorage {
  courses?: ICourse;
  grades?: IGrade[];
}
