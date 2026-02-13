using MongoDB.Driver;

namespace EHealthClinic.Api.Mongo;

public interface IMongoContext
{
    IMongoDatabase Database { get; }
    IMongoCollection<T> Collection<T>(string name);
}
