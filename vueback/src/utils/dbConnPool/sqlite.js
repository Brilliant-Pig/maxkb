// 导入数据库配置
const db_conf = require('config').get('dbConfig');
// 打开数据库文件
const sqlite = require('better-sqlite3');
const dbFile = new sqlite(db_conf.filename, {
    readonly: false,
    fileMustExist: false,
    verbose: console.log
});

// 封装 SQL 执行的方法
exports.query = async (sql, sqlParams) => {
    try {
        const stmt = dbFile.prepare(sql);

        // 判断是否为查询语句
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA');

        if (isSelect) {
            // 查询用 all()
            return sqlParams ? stmt.all(sqlParams) : stmt.all();
        } else {
            // 写入/更新用 run()
            const info = sqlParams ? stmt.run(sqlParams) : stmt.run();
            return info;
        }
    } catch (err) {
        console.error('数据库操作失败:', err);
        return err;
    }
};
