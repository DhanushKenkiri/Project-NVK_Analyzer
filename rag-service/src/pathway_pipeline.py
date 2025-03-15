from pathway import PathwayPipeline
from transformers import pipeline

class PathwayTextPipeline(PathwayPipeline):
    def __init__(self):
        self.nlp = pipeline("question-answering")

    def process(self, text):
        result = self.nlp(question="What is the main idea?", context=text)
        return result['answer']