import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'email_verification_tokens'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer("user_id").notNullable().references("users.id").onDelete("CASCADE")

      table.string("email").unique().notNullable()
      table.uuid("verification_token").index().unique().notNullable()
      table.timestamp("verfied_at", { useTz: true })

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
