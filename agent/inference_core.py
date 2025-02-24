import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from google.generativeai.types.safety_types import HarmBlockThreshold, HarmCategory

UNFILTERED = HarmBlockThreshold.BLOCK_NONE
SERVER_CWD = os.path.join(os.getcwd(),os.path.dirname(__file__))

load_dotenv()

class BaseModel:
    def __init__(self) -> None:
        try:
            self.__api_key = os.getenv("GOOGLE_GENAI_API_KEY")
        except Exception as error:
            print(f"An error occured while instantiating from BaseModel: {error}")
            
        self.__safety_settings = {
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: UNFILTERED,
            HarmCategory.HARM_CATEGORY_HARASSMENT: UNFILTERED,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: UNFILTERED,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: UNFILTERED,
            HarmCategory.HARM_CATEGORY_UNSPECIFIED: UNFILTERED
        }
        self.__agent = ChatGoogleGenerativeAI(safety_settings=self.__safety_settings,
                                            model="gemini-1.5-flash",
                                            api_key=self.__api_key)
        
    def _respond(self, message: str) -> None:
        return self.__agent.invoke(message).content
