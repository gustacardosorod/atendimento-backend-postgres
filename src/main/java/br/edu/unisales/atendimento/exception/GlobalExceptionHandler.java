package br.edu.unisales.atendimento.exception;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime; import java.util.*;
@RestControllerAdvice
public class GlobalExceptionHandler{
 @ExceptionHandler(ResourceNotFoundException.class) public ResponseEntity<ApiError> notFound(ResourceNotFoundException e,HttpServletRequest r){return build(HttpStatus.NOT_FOUND,e.getMessage(),r.getRequestURI(),null);}
 @ExceptionHandler(BusinessException.class) public ResponseEntity<ApiError> business(BusinessException e,HttpServletRequest r){return build(HttpStatus.BAD_REQUEST,e.getMessage(),r.getRequestURI(),null);}
 @ExceptionHandler(BadCredentialsException.class) public ResponseEntity<ApiError> credentials(BadCredentialsException e,HttpServletRequest r){return build(HttpStatus.UNAUTHORIZED,"Usuário ou senha inválidos.",r.getRequestURI(),null);}
 @ExceptionHandler(AccessDeniedException.class) public ResponseEntity<ApiError> denied(AccessDeniedException e,HttpServletRequest r){return build(HttpStatus.FORBIDDEN,"Usuário não possui permissão para executar esta operação.",r.getRequestURI(),null);}
 @ExceptionHandler(MethodArgumentNotValidException.class) public ResponseEntity<ApiError> validation(MethodArgumentNotValidException e,HttpServletRequest r){Map<String,String> c=new LinkedHashMap<>();e.getBindingResult().getFieldErrors().forEach(x->c.put(x.getField(),x.getDefaultMessage()));return build(HttpStatus.BAD_REQUEST,"Existem dados inválidos na requisição.",r.getRequestURI(),c);}
 @ExceptionHandler(DataIntegrityViolationException.class) public ResponseEntity<ApiError> db(DataIntegrityViolationException e,HttpServletRequest r){return build(HttpStatus.CONFLICT,"Operação não permitida devido a uma restrição de dados.",r.getRequestURI(),null);}
 @ExceptionHandler(Exception.class) public ResponseEntity<ApiError> generic(Exception e,HttpServletRequest r){return build(HttpStatus.INTERNAL_SERVER_ERROR,"Erro interno do servidor.",r.getRequestURI(),null);}
 private ResponseEntity<ApiError> build(HttpStatus s,String m,String p,Map<String,String> c){return ResponseEntity.status(s).body(new ApiError(LocalDateTime.now(),s.value(),s.getReasonPhrase(),m,p,c));}
}
