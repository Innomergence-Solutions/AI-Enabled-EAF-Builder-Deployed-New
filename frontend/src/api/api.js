import axios from "axios";

const API_URL = "http://148.113.202.141:5001/generateEAF/";

export const generateEAF = async (incident, date, brief_description,budget) => {
  try {
    const response = await axios.post(API_URL, { 
      incident, 
      date, 
      brief_description,
      budget
    
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    console.log(response);
    return response.data.full_description;
  } catch (error) {
    console.error("Error generating EAF:", error.response ? error.response.data : error.message);
    return "Error generating EAF";
  }
};
