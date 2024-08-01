using Newtonsoft.Json.Linq;
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace Updater
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            Console.Title = "Zimbaflix Updater";
            string apiKey = "50c7face1bc4f49590eb3d74e7111608"; // Substitua pela sua chave da API do TMDB
            string baseUrl = "https://api.themoviedb.org/3/movie/";
            HttpClient client = new HttpClient();
            string fileName = "list.m3u8";

            while (true)
            {
                // Solicita o ID do filme
                Console.ForegroundColor = ConsoleColor.Green;
                Console.Write("Digite o ID do filme: ");
                string movieId = Console.ReadLine();
                if (movieId.ToLower() == "sair")
                {
                    break;
                }

                // Faz a chamada à API do TMDB
                string requestUrl = $"{baseUrl}{movieId}?api_key={apiKey}&language=pt-BR";
                HttpResponseMessage response = await client.GetAsync(requestUrl);
                string responseData = await response.Content.ReadAsStringAsync();

                // Analisa o JSON da resposta
                JObject movieData = JObject.Parse(responseData);
                string title = movieData["title"].ToString();
                string posterPath = movieData["poster_path"]?.ToString();
                string posterUrl = $"https://image.tmdb.org/t/p/w300{posterPath}";

                // Obtém os gêneros do filme
                JArray genresArray = (JArray)movieData["genres"];
                string genres = string.Join(", ", genresArray.Select(g => g["name"].ToString()));

                // Solicita a URL do filme
                Console.Write("Digite a URL do filme: ");
                string movieUrl = Console.ReadLine();

                // Cria o conteúdo M3U8
                string m3u8Content = $"#EXTINF:-1 tvg-id=\"{movieId}\" tvg-name=\"{title}\" tvg-logo=\"{posterUrl}\" group-title=\"Filmes | {genres}\",{title}\n{movieUrl}\n";

                // Lê o conteúdo existente do arquivo M3U8 (se houver)
                string existingContent = File.Exists(fileName) ? File.ReadAllText(fileName) : string.Empty;

                // Adiciona o novo conteúdo ao início do existente
                string updatedContent = m3u8Content + existingContent;

                // Salva o conteúdo atualizado no arquivo
                File.WriteAllText(fileName, updatedContent);

                Console.WriteLine($"Filme '{title}' adicionado à lista M3U8.");
            }

            Console.WriteLine("Encerrando o programa.");
            Console.ResetColor(); // Restaura a cor original do texto
        }
    }
}
