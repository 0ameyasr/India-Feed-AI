import os
from agent.inference_core import BaseModel

class Summarizer(BaseModel):
    def __init__(self):
        super().__init__()
        try:
            self.__system_prompt_path_summary = f"{os.path.join(os.getcwd(),os.path.dirname(__file__))}/system/summary-system-prompt.txt"
            self.__system_prompt_path_title = f"{os.path.join(os.getcwd(),os.path.dirname(__file__))}/system/title-system-prompt.txt"
            
            with open(self.__system_prompt_path_summary) as summarizer_system_prompt_summary:
                self.__system_prompt_summary = summarizer_system_prompt_summary.read()
            
            with open(self.__system_prompt_path_title) as summarizer_system_prompt_title:
                self.__system_prompt_title = summarizer_system_prompt_title.read()
            
            
        except Exception as error:
            print(f"An error occured while instantiating from Summarizer: {error}")

    def summarize(self,article:str) -> str:
        return super()._respond(self.__system_prompt_summary.format(article))   

    def title(self,article:str) -> str:
        return super()._respond(self.__system_prompt_title.format(article))     