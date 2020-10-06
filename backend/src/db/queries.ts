// Tables & Columns
export const TASK_TABLE = "Task";
export const TASK_NAME = "name";
export const TASK_STATE = "state";
export const TASK_GROUPID = "groupId";

export const GROUP_TABLE = "Group";
export const GROUP_NAME = "name";

export const DEP_TABLE = "Dependency";
export const DEP_FROM = "taskFrom"; 
export const DEP_TO = "taskTo";

// QUERIES
export const SELECT_TASK_DEPENDENCY_LIST = (taskId: number) => `
        WITH RECURSIVE traverse AS (
            SELECT ${DEP_TABLE}.${DEP_FROM}, ${DEP_TABLE}.${DEP_TO} FROM ${DEP_TABLE}
            WHERE ${DEP_TABLE}.${DEP_FROM} = ${taskId}
        UNION ALL
            SELECT DISTINCT ${DEP_TABLE}.${DEP_FROM}, ${DEP_TABLE}.${DEP_TO} FROM ${DEP_TABLE}
            INNER JOIN traverse
            ON ${DEP_TABLE}.${DEP_FROM} = traverse.${DEP_TO}
        )
        SELECT ${DEP_FROM}, ${DEP_TO} FROM traverse
        GROUP BY ${DEP_TO};
    `;

export const SELECT_TASK_TOPOLOGICAL_LIST = (taskId: number) => `
        WITH RECURSIVE traverse(${DEP_FROM}, ${DEP_TO}, depth) AS (
            SELECT ${DEP_TABLE}.${DEP_FROM}, ${DEP_TABLE}.${DEP_TO}, 0 FROM ${DEP_TABLE}
            WHERE ${DEP_TABLE}.tFrom = ${taskId}
        UNION ALL
            SELECT DISTINCT ${DEP_TABLE}.${DEP_FROM}, ${DEP_TABLE}.${DEP_TO}, traverse.depth + 1 FROM traverse
            INNER JOIN ${DEP_TABLE}
            ON ${DEP_TABLE}.${DEP_FROM} = traverse.${DEP_TO}
        )
        SELECT ${TASK_TABLE}.* FROM ${TASK_TABLE}
        INNER JOIN traverse ON ${TASK_TABLE}.id = traverse.${DEP_TO}
        GROUP BY ${TASK_TABLE}.id
        ORDER BY MAX(depth) DESC;
    `;
