using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace EHealthClinic.Api.Mongo;

public sealed class MongoContext : IMongoContext
{
    public IMongoDatabase Database { get; }

    public MongoContext(IOptions<MongoOptions> opt)
    {
        var client = new MongoClient(opt.Value.ConnectionString);
        Database = client.GetDatabase(opt.Value.Database);
    }

    public IMongoCollection<T> Collection<T>(string name) => Database.GetCollection<T>(name);
}
