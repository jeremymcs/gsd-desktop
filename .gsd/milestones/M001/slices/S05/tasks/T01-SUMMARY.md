# T01 Summary: Research Store Bridge

Added typed desktop inputs and IPC for research start, proposed research output, and research review decisions. Main-process planning operations now enforce confirmed DISCUSS before research writes, persist proposed findings through `generated-output.proposed`, and persist accept/reject through `generated-output.reviewed`.

Also tightened planning store cleanup so synchronous planning errors close the SQLite store before propagating.
