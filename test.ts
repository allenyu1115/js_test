// Convert a number literal into a tuple of that length
type BuildTuple<N extends number, R extends any[] = []> = 
  R['length'] extends N ? R : BuildTuple<N, [any, ...R]>;

// Add two numbers by concatenating tuples and checking length
type Add<A extends number, B extends number> = 
  [...BuildTuple<A>, ...BuildTuple<B>]['length'];



type Result = Add<2, 3>; 
type Result2 = Add<10, 7>; 


// Define possible status codes as literal types
type StatusCode = 200 | 404 | 500;

// Conditional type to determine the data type based on status
type ApiResponseData<T extends StatusCode> = T extends 200 ? { id: number; name: string } : string;

// Response type using the conditional type
type ApiResponse<T extends StatusCode> = {
  status: T;
  data: ApiResponseData<T>;
};


// Example usage
const successResponse: ApiResponse<200> = {
  status: 200,
  data: { id: 1, name: "Alice" },
};

const notFoundResponse: ApiResponse<404> = {
  status: 404,
  data: "Resource not found",
};

const serverErrorResponse: ApiResponse<500> = {
  status: 500,
  data: "Internal server error",
};

handleApiResponse(successResponse); // Logs: Success: ID = 1, Name = Alice
handleApiResponse(notFoundResponse); // Logs: Error: Resource not found
handleApiResponse(serverErrorResponse); // Logs: Error: Internal server error

function isSuccessResponse(res: ApiResponse<StatusCode>): res is ApiResponse<200> {
  return res.status === 200;
}

function handleApiResponse<T extends StatusCode>(response: ApiResponse<T>) {
  if (isSuccessResponse(response)) {
    // Now TypeScript knows this is ApiResponse<200>
    console.log(`Success: ID = ${response.data.id}, Name = ${response.data.name}`);
  } else {
    // Here, response is ApiResponse<404 | 500>, and data is string
    console.log(`Error: ${response.data}`);
  }
}

type FilterProperties<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Example usage: Extract keys of an object where the value is a string
interface User {
  name: string;
  age: number;
  active: boolean;
}

type StringKeys = FilterProperties<User, string>; // "name"

function getStringProperty<K extends StringKeys>(obj: User, key: K) {
  return obj[key]; // Type-safe: Only allows "name"
}

const user: User = { name: "Alice", age: 30, active: true };
console.log(getStringProperty(user, "name"));
