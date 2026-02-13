namespace EHealthClinic.Api.Mongo;

public sealed class MongoOptions
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string Database { get; set; } = "EHealthClinicNoSql";
}
