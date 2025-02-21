import os
from inference_core import BaseModel

class Summarizer(BaseModel):
    def __init__(self):
        super().__init__()
        try:
            self.__system_prompt_path = f"{os.path.join(os.getcwd(),os.path.dirname(__file__))}/system/summary-system-prompt.txt"
            with open(self.__system_prompt_path) as summarizer_system_prompt:
                self.__system_prompt = summarizer_system_prompt.read()
        except Exception as error:
            print(f"An error occured while instantiating from Summarizer: {error}")

    def summarize(self):
        return super()._respond(self.__system_prompt)     

print(Summarizer().summarize())