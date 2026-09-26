$ErrorActionPreference = "Stop"

$base = "http://localhost:8080"

function Titulo($texto) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $texto -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

try {

    Titulo "0 - LOGIN ADMIN"

    $adminLogin = Invoke-RestMethod `
        -Method POST `
        -Uri "$base/api/auth/login" `
        -ContentType "application/json" `
        -Body (@{
            email = "admin@atendimento.local"
            senha  = "Admin@123456"
        } | ConvertTo-Json)

    $adminToken = $adminLogin.token

    $adminHeaders = @{
        Authorization = "Bearer $adminToken"
    }

    Write-Host "Login realizado com sucesso." -ForegroundColor Green
    Write-Host "Usuario: $($adminLogin.nome)"
    Write-Host "Perfil : $($adminLogin.perfil)"

    # Dados únicos para permitir executar o script várias vezes
    $runId = Get-Date -Format "MMddHHmmss"
    $cpf = "9$runId"
    $email = "cliente.crud.$runId@email.com"

    Titulo "1 - CREATE / POST"

    $cliente = Invoke-RestMethod `
        -Method POST `
        -Uri "$base/api/auth/register" `
        -ContentType "application/json" `
        -Body (@{
            nome     = "Cliente CRUD"
            cpf      = $cpf
            email    = $email
            telefone = "27999990000"
            senha    = "Senha@123"
        } | ConvertTo-Json)

    $clienteId = $cliente.id

    Write-Host "Cliente criado com sucesso." -ForegroundColor Green
    Write-Host ""
    $cliente | Format-List

    Titulo "2 - READ / GET"

    $clienteConsulta = Invoke-RestMethod `
        -Method GET `
        -Uri "$base/api/clientes/$clienteId" `
        -Headers $adminHeaders

    Write-Host "Cliente consultado com sucesso." -ForegroundColor Green
    Write-Host ""
    $clienteConsulta | Format-List

    Titulo "3 - UPDATE / PUT"

    $clienteAtualizado = Invoke-RestMethod `
        -Method PUT `
        -Uri "$base/api/clientes/$clienteId" `
        -Headers $adminHeaders `
        -ContentType "application/json" `
        -Body (@{
            nome     = "Cliente CRUD Atualizado"
            email    = $email
            telefone = "27988880000"
        } | ConvertTo-Json)

    Write-Host "Cliente atualizado com sucesso." -ForegroundColor Green
    Write-Host ""
    $clienteAtualizado | Format-List

    Titulo "4 - DELETE LOGICO / PATCH"

    $respostaDelete = Invoke-WebRequest `
        -Method PATCH `
        -Uri "$base/api/clientes/$clienteId/inativar" `
        -Headers $adminHeaders `
        -UseBasicParsing

    Write-Host "Cliente inativado com sucesso." -ForegroundColor Green
    Write-Host "HTTP Status: $($respostaDelete.StatusCode)"

    Titulo "5 - READ FINAL / COMPROVACAO"

    $clienteFinal = Invoke-RestMethod `
        -Method GET `
        -Uri "$base/api/clientes/$clienteId" `
        -Headers $adminHeaders

    $clienteFinal | Format-List

    Write-Host ""
    if ($clienteFinal.ativo -eq $false) {
        Write-Host "CONFIRMACAO: ativo = false" -ForegroundColor Green
        Write-Host "DELETE LOGICO VALIDADO COM SUCESSO." -ForegroundColor Green
    }
    else {
        Write-Host "ATENCAO: o cliente ainda aparece como ativo." -ForegroundColor Yellow
    }

    Titulo "RESUMO DA EXECUCAO"

    Write-Host "CREATE : OK" -ForegroundColor Green
    Write-Host "READ   : OK" -ForegroundColor Green
    Write-Host "UPDATE : OK" -ForegroundColor Green
    Write-Host "DELETE : OK (inativacao logica)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cliente ID : $clienteId"
    Write-Host "CPF        : $cpf"
    Write-Host "Email      : $email"
    Write-Host ""
    Write-Host "Fluxo demonstrado:" -ForegroundColor Cyan
    Write-Host "Controller -> Service -> Repository -> JPA/Hibernate -> PostgreSQL"
}
catch {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "ERRO DURANTE O TESTE" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }

    exit 1
}
