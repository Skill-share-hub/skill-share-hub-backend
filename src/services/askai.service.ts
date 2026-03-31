import axios from 'axios'
import { MessagesType } from '../modules/chatbot/chatbot.types'
import { env } from '../config/env'


export const askAi = async (messages:MessagesType[] , model = "mistralai/mistral-small-3.1-24b-instruct:free") => {
  try{
    const {data:response} = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages,
      },
      {
        headers: {
          "Authorization": `Bearer ${env.openRouteApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.choices[0].message ;
  }catch(error){
    console.log("Ai response failed!");
    throw error ;
  }
}