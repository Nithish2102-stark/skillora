from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from app.mentor.context import LearnerContext, SupabaseContextLoader

Intent = Literal["profile", "skills", "learning", "career", "progress", "general"]


class MentorState(TypedDict, total=False):
    message: str
    history: list[dict[str, str]]
    context: LearnerContext
    intent: Intent
    specialist: str
    response: str


class GeminiProvider:
    async def generate(self, prompt: str) -> str:
        raise NotImplementedError


def classify_intent(message: str) -> Intent:
    text = message.casefold()
    if any(term in text for term in ("profile", "education", "institution", "degree", "background")):
        return "profile"
    if any(term in text for term in ("skill", "gap", "proficiency", "competenc")):
        return "skills"
    if any(term in text for term in ("course", "learn", "study", "roadmap", "recommend")):
        return "learning"
    if any(term in text for term in ("career", "role", "job", "interview", "path")):
        return "career"
    if any(term in text for term in ("progress", "assessment", "enrollment", "completed", "streak")):
        return "progress"
    return "general"


def _specialist_node(name: str):
    def node(state: MentorState) -> dict[str, str]:
        return {"specialist": name}

    return node


def _route(state: MentorState) -> Intent:
    return state.get("intent", "general")


def build_mentor_graph(loader: SupabaseContextLoader, gemini: GeminiProvider):
    async def retrieve_context(_: MentorState) -> dict[str, LearnerContext]:
        return {"context": await loader.load()}

    def route_message(state: MentorState) -> dict[str, Intent]:
        return {"intent": classify_intent(state["message"])}

    async def generate_response(state: MentorState) -> dict[str, str]:
        context = state["context"]
        prompt = build_grounded_prompt(state, context)
        return {"response": await gemini.generate(prompt)}

    def validate_response(state: MentorState) -> dict[str, str]:
        response = state.get("response", "").strip()
        if not response:
            raise RuntimeError("AI Mentor returned an empty response.")
        return {"response": response}

    graph = StateGraph(MentorState)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("classify_intent", route_message)
    for intent, label in (
        ("profile", "Learner Profile Agent"),
        ("skills", "Skill Analysis Agent"),
        ("learning", "Learning Recommendation Agent"),
        ("career", "Career Guidance Agent"),
        ("progress", "Progress Evaluation Agent"),
        ("general", "Orchestrator Agent"),
    ):
        graph.add_node(intent, _specialist_node(label))
    graph.add_node("generate_response", generate_response)
    graph.add_node("validate_response", validate_response)
    graph.add_edge(START, "retrieve_context")
    graph.add_edge("retrieve_context", "classify_intent")
    graph.add_conditional_edges("classify_intent", _route)
    for intent in ("profile", "skills", "learning", "career", "progress", "general"):
        graph.add_edge(intent, "generate_response")
    graph.add_edge("generate_response", "validate_response")
    graph.add_edge("validate_response", END)
    return graph.compile()


def build_grounded_prompt(state: MentorState, context: LearnerContext) -> str:
    specialist = state.get("specialist", "Orchestrator Agent")
    career = context.career_goal or {}
    profile = context.profile or {}
    return f"""You are the {specialist} for Skillora, an authenticated learning platform.
Answer the learner's message using only the verified context below.
Never invent profile facts, skills, scores, course records, career roles, progress, or recommendations.
If the context does not contain enough information, say that clearly and suggest what the learner can save or do next.
Do not claim to have performed database changes. Keep the answer practical and concise.

Verified learner context:
Profile: {profile}
Career goal: {career}
Saved skills: {context.skills}
Career requirements: {context.requirements}
Skill gaps: {context.skill_gaps}
Course catalogue: {context.courses}
Enrollments: {context.enrollments}
Assessment attempts: {context.assessment_attempts}
Learning progress: {context.learning_progress}

Recent conversation:
{state.get("history", [])[-10:]}

Learner message:
<learner_message>
{state["message"]}
</learner_message>
"""
