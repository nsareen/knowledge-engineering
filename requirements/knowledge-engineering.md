I need a solution which can build a knowledge graph from information extraction out of unstructured documents such as pptx,pdf which can contain any type of content but dont want it to be videos, rather text, images, tables. 

The solution should be very intelligently identifying key concepts, entities, relationship between concepts, entities, relationship between entities and attributes. The solution should be flexible in expecting a "metamodel" or Taxonomy to start with and use that to identify concepts, entities, attributes and extend or map using Large language models like OpenAI GPT 4.0 multimodal analysis. If the meta model doesnt exist, use large language models like OpenAI GPT 4.0's inherent knowledge to identify the concepts, entities, relationship, in context of some pre-defined input of domain / industry or reading the context from the document itself, what it explains, what is the key message of the document and infer the concepts, entiteis, relationships relevant to it.

The solution should not only capture the concepts, entities, relationships, but also store the documents as additional large memory context , in case the knowledge graph is not able to address a certain search query , question and answer query, knowledge retrieval query, the source data stored in the graph broken by pages / slides and summarized into text by Large language model such as Open AI GPT4.0 Multi modal analysis and store the content in another sub graph, but also be able to build correlation with the knowledge graph's concepts, entities & relationships.

The solution should be able to do the following
1) have ingestion capability 
2) extraction capability
3) review the extracted content from a temporary storage
4) post review and edits, publish to knowledge graph
5) ability to run global search on knowledge graph + content summarized sub graph
6) ability to run question and answers on the content of documents describing entities & relationships
7) ability to retrieve specific knowledge about how something happened, why something is like what it is etc. 
8) ability to optionally share GAPs in the documents content e.g. Architecture assessment in the document if did not follow the right structure to do the assessment or capture relevant information , should be mapped with the meta model and flagged as a gap and a report should be shown with recommendations to fix the gaps.
9) Ability to provide a chat interface for asking contextual / interactive queries questions .
10) Solution should be built using Large language model & multi agent workflow architecture to orchestrate Agentic AI workflows  
11) Solution should provide explainability on what steps it is processing to get the response
12) Solution should provide citations to documents / slides using the correlation capabilities built into knowledge graph.


The solution is a POC to provide confidence score and benchmarks to test the hypothesis if the large language models inherent knowledge augmented with enterprise metamodels augmented with multi modal analysis on rich media , is able to describe whats described in the documents, relate events, entities, relationships across multiple documents into a unified hybrid knowledge graph.

The solution should use
PostgreSQL for database operations 
PostgreSQL in case vector capabilities are required
Neo4J Aura for knowledge graph
OpenAI GPT model
Either of Claude Code Typescript SDK / Langchain / Langgraph / N8N for Multi Agent workflow runtime.
Typescript /Vite / Cytoscope / D3 / React.js / Tailwind CSS for frontend
Modern web interface with intuitive graph visualization & an interactive chatbot.
solution should not be built with complex things like Authentication , RBAC, complex middleware / CORS complexities 