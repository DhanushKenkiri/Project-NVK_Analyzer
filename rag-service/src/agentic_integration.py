from langgraph import LangGraph
from crew_ai import CrewAI

class AgenticIntegration:
    def __init__(self):
        self.langgraph = LangGraph()
        self.crew_ai = CrewAI()

    def enhance_retrieval(self, query):
        validation_result = self.crew_ai.validate(query)
        if validation_result.is_valid:
            return self.langgraph.enhance(query)
        return None

# Usage
agentic_integration = AgenticIntegration()
enhanced_query = agentic_integration.enhance_retrieval(query="your_query")